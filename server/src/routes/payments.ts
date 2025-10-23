import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { AsaasService } from '../services/asaas.service';
import { prisma } from '../prisma';

const paymentRoutes: FastifyPluginAsync = async (app) => {
  // ===================================================================
  // CREATE CHECKOUT SESSION
  // ===================================================================
  const createCheckoutSchema = z.object({
    courseId: z.string().optional(),
    ebookId: z.string().optional(),
    paperId: z.string().optional(),
    paymentMethod: z.enum(['CREDIT_CARD', 'BOLETO', 'PIX']),
    customer: z.object({
      name: z.string().min(1),
      email: z.string().email(),
      cpfCnpj: z.string().min(11),
      phone: z.string().optional(),
      mobilePhone: z.string().optional(),
      postalCode: z.string().optional(),
      address: z.string().optional(),
      addressNumber: z.string().optional(),
      province: z.string().optional(),
    }),
    creditCard: z.object({
      holderName: z.string(),
      number: z.string(),
      expiryMonth: z.string(),
      expiryYear: z.string(),
      ccv: z.string(),
    }).optional(),
    installments: z.number().min(1).max(12).optional(),
    registration: z.object({
      password: z.string().min(8),
    }).optional(),
  }).refine(
    (data) => data.courseId || data.ebookId || data.paperId,
    { message: 'courseId, ebookId ou paperId é obrigatório' }
  ).refine(
    (data) => {
      const count = [data.courseId, data.ebookId, data.paperId].filter(Boolean).length;
      return count === 1;
    },
    { message: 'Apenas um de courseId, ebookId ou paperId deve ser fornecido' }
  );

  app.post(
    '/checkout/create',
    async (request, reply) => {
      try {
        const body = createCheckoutSchema.parse(request.body);

        let userId: string;
        let isNewUser = false;

        // Se há dados de registro, criar novo usuário
        if (body.registration) {
          // Verificar se email já existe
          const existingUser = await prisma.user.findUnique({
            where: { email: body.customer.email },
          });

          if (existingUser) {
            return reply.status(400).send({ error: 'Email já cadastrado. Faça login para continuar.' });
          }

          // Criar novo usuário
          const bcrypt = require('bcrypt');
          const hashedPassword = await bcrypt.hash(body.registration.password, 10);

          const newUser = await prisma.user.create({
            data: {
              name: body.customer.name,
              email: body.customer.email,
              password: hashedPassword,
              role: 'STUDENT',
            },
          });

          userId = newUser.id;
          isNewUser = true;
        } else {
          // Usuário deve estar autenticado
          try {
            await app.authenticate(request, reply);
            userId = request.currentUser!.id;
          } catch (error) {
            return reply.status(401).send({ error: 'Autenticação necessária' });
          }
        }

        // Buscar curso, ebook ou paper
        let course: any = null;
        let ebook: any = null;
        let paper: any = null;
        let itemType: 'course' | 'ebook' | 'paper';
        let itemTitle: string;
        let itemPrice: number;
        let itemDescription: string | null;

        if (body.courseId) {
          course = await prisma.course.findUnique({
            where: { id: body.courseId },
          });

          if (!course) {
            return reply.status(404).send({ error: 'Curso não encontrado' });
          }

          // Verificar se já está matriculado
          const existingEnrollment = await prisma.courseEnrollment.findFirst({
            where: {
              userId,
              courseId: body.courseId,
            },
          });

          if (existingEnrollment) {
            return reply.status(400).send({ error: 'Você já está matriculado neste curso' });
          }

          itemType = 'course';
          itemTitle = course.title;
          itemPrice = course.price;
          itemDescription = course.description;
        } else if (body.ebookId) {
          ebook = await prisma.ebook.findUnique({
            where: { id: body.ebookId },
          });

          if (!ebook) {
            return reply.status(404).send({ error: 'E-book não encontrado' });
          }

          // Verificar se já comprou o ebook
          const existingPurchase = await prisma.orderItem.findFirst({
            where: {
              ebookId: body.ebookId,
              order: {
                userId,
                status: 'COMPLETED',
                paymentStatus: 'CONFIRMED',
              },
            },
          });

          if (existingPurchase) {
            return reply.status(400).send({ error: 'Você já adquiriu este e-book' });
          }

          itemType = 'ebook';
          itemTitle = ebook.title;
          itemPrice = ebook.price;
          itemDescription = ebook.description;
        } else if (body.paperId) {
          paper = await prisma.paper.findUnique({
            where: { id: body.paperId },
          });

          if (!paper) {
            return reply.status(404).send({ error: 'Trabalho não encontrado' });
          }

          // Verificar se já comprou o paper
          const existingPurchase = await prisma.orderItem.findFirst({
            where: {
              paperId: body.paperId,
              order: {
                userId,
                status: 'COMPLETED',
                paymentStatus: 'CONFIRMED',
              },
            },
          });

          if (existingPurchase) {
            return reply.status(400).send({ error: 'Você já adquiriu este trabalho' });
          }

          itemType = 'paper';
          itemTitle = paper.title;
          itemPrice = paper.price;
          itemDescription = paper.description;
        } else {
          return reply.status(400).send({ error: 'courseId, ebookId ou paperId é obrigatório' });
        }

        // Inicializar Asaas
        const asaas = await AsaasService.initialize();
        if (!asaas) {
          return reply.status(500).send({ error: 'Integração de pagamento não configurada' });
        }

        // Criar ou atualizar cliente no Asaas
        const asaasCustomer = await asaas.createOrUpdateCustomer({
          name: body.customer.name,
          cpfCnpj: body.customer.cpfCnpj,
          email: body.customer.email,
          phone: body.customer.phone,
          mobilePhone: body.customer.mobilePhone,
          postalCode: body.customer.postalCode,
          address: body.customer.address,
          addressNumber: body.customer.addressNumber,
          province: body.customer.province,
        });

        // Criar Order no banco
        const orderItemData: any = {
          title: itemTitle,
          description: itemDescription,
          price: itemPrice,
        };

        if (itemType === 'course') {
          orderItemData.courseId = body.courseId;
        } else if (itemType === 'ebook') {
          orderItemData.ebookId = body.ebookId;
        } else if (itemType === 'paper') {
          orderItemData.paperId = body.paperId;
        }

        const order = await prisma.order.create({
          data: {
            userId,
            totalAmount: itemPrice,
            status: 'PENDING',
            paymentStatus: 'PENDING',
            paymentMethod: body.paymentMethod,
            customerName: body.customer.name,
            customerEmail: body.customer.email,
            customerCpfCnpj: body.customer.cpfCnpj,
            customerPhone: body.customer.phone || body.customer.mobilePhone,
            items: {
              create: orderItemData,
            },
          },
          include: {
            items: true,
          },
        });

        // Data de vencimento (7 dias para boleto, 30 min para PIX, hoje para cartão)
        const dueDate = new Date();
        if (body.paymentMethod === 'BOLETO') {
          dueDate.setDate(dueDate.getDate() + 7);
        } else if (body.paymentMethod === 'PIX') {
          dueDate.setMinutes(dueDate.getMinutes() + 30);
        }
        const dueDateStr = dueDate.toISOString().split('T')[0];

        // Criar cobrança no Asaas
        const installmentCount = body.installments || 1;

        let chargeDescription = '';
        if (itemType === 'course') {
          chargeDescription = `Curso: ${itemTitle}`;
        } else if (itemType === 'ebook') {
          chargeDescription = `E-book: ${itemTitle}`;
        } else if (itemType === 'paper') {
          chargeDescription = `Trabalho: ${itemTitle}`;
        }

        const chargeData: any = {
          customer: asaasCustomer.id,
          billingType: body.paymentMethod === 'CREDIT_CARD' ? 'CREDIT_CARD' : body.paymentMethod,
          value: itemPrice / 100, // Converter centavos para reais
          dueDate: dueDateStr,
          description: chargeDescription,
          externalReference: order.id,
        };

        // Só adicionar campos de parcelamento se houver parcelamento real (> 1)
        // Para pagamento à vista (PIX, Boleto, Cartão 1x), NÃO enviar esses campos
        if (installmentCount > 1) {
          chargeData.installmentCount = installmentCount;
          chargeData.installmentValue = (itemPrice / 100) / installmentCount;
        }

        const charge = await asaas.createCharge(chargeData);

        // Processar pagamento com cartão se necessário
        if (body.paymentMethod === 'CREDIT_CARD' && body.creditCard) {
          const creditCardPayment = await asaas.payWithCreditCard(charge.id, {
            creditCard: {
              holderName: body.creditCard.holderName,
              number: body.creditCard.number,
              expiryMonth: body.creditCard.expiryMonth,
              expiryYear: body.creditCard.expiryYear,
              ccv: body.creditCard.ccv,
            },
            creditCardHolderInfo: {
              name: body.customer.name,
              email: body.customer.email,
              cpfCnpj: body.customer.cpfCnpj,
              postalCode: body.customer.postalCode || '00000000',
              addressNumber: body.customer.addressNumber || 'S/N',
              phone: body.customer.phone || body.customer.mobilePhone || '0000000000',
            },
            remoteIp: request.ip,
          });

          // Atualizar order com resultado
          await prisma.order.update({
            where: { id: order.id },
            data: {
              paymentStatus: creditCardPayment.status === 'CONFIRMED' || creditCardPayment.status === 'RECEIVED' ? 'CONFIRMED' : 'PENDING',
              status: creditCardPayment.status === 'CONFIRMED' || creditCardPayment.status === 'RECEIVED' ? 'COMPLETED' : 'PENDING',
            },
          });

          // Se pagamento confirmado, criar matrícula (para cursos)
          // Para ebooks, a compra é rastreada via OrderItem automaticamente
          if (creditCardPayment.status === 'CONFIRMED' || creditCardPayment.status === 'RECEIVED') {
            if (itemType === 'course' && body.courseId) {
              await prisma.courseEnrollment.create({
                data: {
                  userId,
                  courseId: body.courseId,
                  progress: 0,
                },
              });
            }
            // Ebooks não precisam de registro separado, OrderItem já rastreia a compra
          }

          return reply.send({
            success: true,
            orderId: order.id,
            chargeId: charge.id,
            status: creditCardPayment.status,
            paymentMethod: body.paymentMethod,
          });
        }

        // Para PIX, gerar QR Code
        if (body.paymentMethod === 'PIX') {
          const pixData = await asaas.getPixQrCode(charge.id);

          await prisma.order.update({
            where: { id: order.id },
            data: {
              pixCode: pixData.payload,
            },
          });

          const response: any = {
            success: true,
            orderId: order.id,
            chargeId: charge.id,
            paymentMethod: body.paymentMethod,
            pix: {
              payload: pixData.payload,
              qrCodeImage: pixData.encodedImage,
              expirationDate: pixData.expirationDate,
            },
          };

          // Se é novo usuário, enviar token para auto-login
          if (isNewUser) {
            const token = app.jwt.sign({ userId, role: 'STUDENT' });
            response.token = token;
            response.user = {
              id: userId,
              name: body.customer.name,
              email: body.customer.email,
              role: 'STUDENT',
            };
          }

          return reply.send(response);
        }

        // Para Boleto
        if (body.paymentMethod === 'BOLETO') {
          await prisma.order.update({
            where: { id: order.id },
            data: {
              boletoUrl: charge.bankSlipUrl,
            },
          });

          return reply.send({
            success: true,
            orderId: order.id,
            chargeId: charge.id,
            paymentMethod: body.paymentMethod,
            boleto: {
              url: charge.bankSlipUrl,
              barcode: charge.invoiceNumber,
            },
          });
        }

        return reply.send({
          success: true,
          orderId: order.id,
          chargeId: charge.id,
          paymentMethod: body.paymentMethod,
        });
      } catch (error: any) {
        console.error('[CHECKOUT] Error:', error);
        return reply.status(400).send({ error: error.message || 'Erro ao processar pagamento' });
      }
    }
  );

  // ===================================================================
  // CHECK PAYMENT STATUS
  // ===================================================================
  app.get(
    '/checkout/status/:orderId',
    { preHandler: app.authenticate },
    async (request, reply) => {
      try {
        const { orderId } = request.params as { orderId: string };
        const userId = request.currentUser!.id;

        const order = await prisma.order.findFirst({
          where: {
            id: orderId,
            userId,
          },
          include: {
            items: true,
          },
        });

        if (!order) {
          return reply.status(404).send({ error: 'Pedido não encontrado' });
        }

        return reply.send({
          orderId: order.id,
          status: order.status,
          paymentStatus: order.paymentStatus,
          paymentMethod: order.paymentMethod,
          totalAmount: order.totalAmount,
          createdAt: order.createdAt,
          items: order.items,
          pixCode: order.pixCode,
          boletoUrl: order.boletoUrl,
        });
      } catch (error: any) {
        console.error('[CHECKOUT] Status check error:', error);
        return reply.status(400).send({ error: error.message });
      }
    }
  );

  // ===================================================================
  // WEBHOOK ASAAS (receber notificações de pagamento)
  // ===================================================================
  app.post(
    '/webhooks/asaas',
    async (request, reply) => {
      try {
        const payload = request.body as any;
        console.log('[ASAAS WEBHOOK] Received:', JSON.stringify(payload, null, 2));

        const { event, payment } = payload;

        if (!payment || !payment.externalReference) {
          console.log('[ASAAS WEBHOOK] No payment or externalReference');
          return reply.send({ received: true });
        }

        const orderId = payment.externalReference;

        // Buscar order
        const order = await prisma.order.findUnique({
          where: { id: orderId },
          include: { items: true },
        });

        if (!order) {
          console.log('[ASAAS WEBHOOK] Order not found:', orderId);
          return reply.send({ received: true });
        }

        // Atualizar status baseado no evento
        let paymentStatus: 'PENDING' | 'CONFIRMED' | 'FAILED' | 'CANCELED' = 'PENDING';
        let orderStatus: 'PENDING' | 'COMPLETED' | 'CANCELED' = 'PENDING';

        if (event === 'PAYMENT_RECEIVED' || event === 'PAYMENT_CONFIRMED') {
          paymentStatus = 'CONFIRMED';
          orderStatus = 'COMPLETED';
        } else if (event === 'PAYMENT_OVERDUE' || event === 'PAYMENT_DELETED') {
          paymentStatus = 'CANCELED';
          orderStatus = 'CANCELED';
        } else if (event === 'PAYMENT_REFUNDED' || event === 'PAYMENT_REFUND_IN_PROGRESS') {
          paymentStatus = 'CANCELED';
          orderStatus = 'CANCELED';
        }

        // Atualizar order
        await prisma.order.update({
          where: { id: orderId },
          data: {
            paymentStatus,
            status: orderStatus,
          },
        });

        // Se pagamento confirmado, criar matrícula no curso
        // Para ebooks e papers, a compra é rastreada via OrderItem automaticamente
        if (paymentStatus === 'CONFIRMED' && order.userId) {
          const courseItem = order.items.find(item => item.courseId);
          const ebookItem = order.items.find(item => item.ebookId);
          const paperItem = order.items.find(item => item.paperId);

          // Criar matrícula de curso
          if (courseItem && courseItem.courseId) {
            // Verificar se já existe matrícula
            const existingEnrollment = await prisma.courseEnrollment.findFirst({
              where: {
                userId: order.userId,
                courseId: courseItem.courseId,
              },
            });

            if (!existingEnrollment) {
              await prisma.courseEnrollment.create({
                data: {
                  userId: order.userId,
                  courseId: courseItem.courseId,
                  progress: 0,
                },
              });
              console.log('[ASAAS WEBHOOK] Enrollment created for user:', order.userId, 'course:', courseItem.courseId);
            }
          }

          // Ebooks: compra já rastreada via OrderItem, apenas log
          if (ebookItem && ebookItem.ebookId) {
            console.log('[ASAAS WEBHOOK] Ebook purchase confirmed for user:', order.userId, 'ebook:', ebookItem.ebookId);
          }

          // Papers: compra já rastreada via OrderItem, apenas log
          if (paperItem && paperItem.paperId) {
            console.log('[ASAAS WEBHOOK] Paper purchase confirmed for user:', order.userId, 'paper:', paperItem.paperId);
          }
        }

        return reply.send({ received: true });
      } catch (error: any) {
        console.error('[ASAAS WEBHOOK] Error:', error);
        return reply.status(200).send({ received: true }); // Sempre retorna 200 para não reenviar
      }
    }
  );

  // ===================================================================
  // ROTA DE TESTE: Simular pagamento confirmado
  // ===================================================================
  app.post(
    '/test/confirm-payment/:orderId',
    async (request, reply) => {
      try {
        const { orderId } = request.params as { orderId: string };

        // Atualizar order para CONFIRMED
        const order = await prisma.order.update({
          where: { id: orderId },
          data: {
            paymentStatus: 'CONFIRMED',
            status: 'COMPLETED',
          },
          include: { items: true },
        });

        // Criar matrícula se for curso
        if (order.userId) {
          const courseItem = order.items.find(item => item.courseId);

          if (courseItem && courseItem.courseId) {
            const existingEnrollment = await prisma.courseEnrollment.findFirst({
              where: {
                userId: order.userId,
                courseId: courseItem.courseId,
              },
            });

            if (!existingEnrollment) {
              await prisma.courseEnrollment.create({
                data: {
                  userId: order.userId,
                  courseId: courseItem.courseId,
                  progress: 0,
                },
              });
            }
          }
        }

        return reply.send({
          success: true,
          message: 'Pagamento confirmado com sucesso (teste)',
          orderId: order.id,
          paymentStatus: order.paymentStatus,
          status: order.status,
        });
      } catch (error: any) {
        console.error('[TEST CONFIRM] Error:', error);
        return reply.status(400).send({ error: error.message });
      }
    }
  );
};

export default paymentRoutes;
