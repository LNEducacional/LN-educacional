"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const zod_1 = require("zod");
const asaas_service_1 = require("../services/asaas.service");
const prisma_1 = require("../prisma");
const paymentRoutes = async (app) => {
    // ===================================================================
    // CREATE CHECKOUT SESSION
    // ===================================================================
    const createCheckoutSchema = zod_1.z.object({
        courseId: zod_1.z.string().optional(),
        ebookId: zod_1.z.string().optional(),
        paymentMethod: zod_1.z.enum(['CREDIT_CARD', 'BOLETO', 'PIX']),
        customer: zod_1.z.object({
            name: zod_1.z.string().min(1),
            email: zod_1.z.string().email(),
            cpfCnpj: zod_1.z.string().min(11),
            phone: zod_1.z.string().optional(),
            mobilePhone: zod_1.z.string().optional(),
            postalCode: zod_1.z.string().optional(),
            address: zod_1.z.string().optional(),
            addressNumber: zod_1.z.string().optional(),
            province: zod_1.z.string().optional(),
        }),
        creditCard: zod_1.z.object({
            holderName: zod_1.z.string(),
            number: zod_1.z.string(),
            expiryMonth: zod_1.z.string(),
            expiryYear: zod_1.z.string(),
            ccv: zod_1.z.string(),
        }).optional(),
        installments: zod_1.z.number().min(1).max(12).optional(),
        registration: zod_1.z.object({
            password: zod_1.z.string().min(8),
        }).optional(),
    }).refine((data) => data.courseId || data.ebookId, { message: 'courseId ou ebookId é obrigatório' }).refine((data) => !(data.courseId && data.ebookId), { message: 'Apenas um de courseId ou ebookId deve ser fornecido' });
    app.post('/checkout/create', async (request, reply) => {
        try {
            const body = createCheckoutSchema.parse(request.body);
            let userId;
            let isNewUser = false;
            // Se há dados de registro, criar novo usuário
            if (body.registration) {
                // Verificar se email já existe
                const existingUser = await prisma_1.prisma.user.findUnique({
                    where: { email: body.customer.email },
                });
                if (existingUser) {
                    return reply.status(400).send({ error: 'Email já cadastrado. Faça login para continuar.' });
                }
                // Criar novo usuário
                const bcrypt = require('bcrypt');
                const hashedPassword = await bcrypt.hash(body.registration.password, 10);
                const newUser = await prisma_1.prisma.user.create({
                    data: {
                        name: body.customer.name,
                        email: body.customer.email,
                        password: hashedPassword,
                        role: 'STUDENT',
                    },
                });
                userId = newUser.id;
                isNewUser = true;
            }
            else {
                // Usuário deve estar autenticado
                try {
                    await app.authenticate(request, reply);
                    userId = request.currentUser.id;
                }
                catch (error) {
                    return reply.status(401).send({ error: 'Autenticação necessária' });
                }
            }
            // Buscar curso ou ebook
            let course = null;
            let ebook = null;
            let itemType;
            let itemTitle;
            let itemPrice;
            let itemDescription;
            if (body.courseId) {
                course = await prisma_1.prisma.course.findUnique({
                    where: { id: body.courseId },
                });
                if (!course) {
                    return reply.status(404).send({ error: 'Curso não encontrado' });
                }
                // Verificar se já está matriculado
                const existingEnrollment = await prisma_1.prisma.courseEnrollment.findFirst({
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
            }
            else if (body.ebookId) {
                ebook = await prisma_1.prisma.ebook.findUnique({
                    where: { id: body.ebookId },
                });
                if (!ebook) {
                    return reply.status(404).send({ error: 'E-book não encontrado' });
                }
                // Verificar se já comprou o ebook
                const existingPurchase = await prisma_1.prisma.orderItem.findFirst({
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
            }
            else {
                return reply.status(400).send({ error: 'courseId ou ebookId é obrigatório' });
            }
            // Inicializar Asaas
            const asaas = await asaas_service_1.AsaasService.initialize();
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
            const orderItemData = {
                title: itemTitle,
                description: itemDescription,
                price: itemPrice,
            };
            if (itemType === 'course') {
                orderItemData.courseId = body.courseId;
            }
            else {
                orderItemData.ebookId = body.ebookId;
            }
            const order = await prisma_1.prisma.order.create({
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
            }
            else if (body.paymentMethod === 'PIX') {
                dueDate.setMinutes(dueDate.getMinutes() + 30);
            }
            const dueDateStr = dueDate.toISOString().split('T')[0];
            // Criar cobrança no Asaas
            const installmentCount = body.installments || 1;
            const chargeData = {
                customer: asaasCustomer.id,
                billingType: body.paymentMethod === 'CREDIT_CARD' ? 'CREDIT_CARD' : body.paymentMethod,
                value: itemPrice / 100, // Converter centavos para reais
                dueDate: dueDateStr,
                description: itemType === 'course' ? `Curso: ${itemTitle}` : `E-book: ${itemTitle}`,
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
                await prisma_1.prisma.order.update({
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
                        await prisma_1.prisma.courseEnrollment.create({
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
                await prisma_1.prisma.order.update({
                    where: { id: order.id },
                    data: {
                        pixCode: pixData.payload,
                    },
                });
                const response = {
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
                await prisma_1.prisma.order.update({
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
        }
        catch (error) {
            console.error('[CHECKOUT] Error:', error);
            return reply.status(400).send({ error: error.message || 'Erro ao processar pagamento' });
        }
    });
    // ===================================================================
    // CHECK PAYMENT STATUS
    // ===================================================================
    app.get('/checkout/status/:orderId', { preHandler: app.authenticate }, async (request, reply) => {
        try {
            const { orderId } = request.params;
            const userId = request.currentUser.id;
            const order = await prisma_1.prisma.order.findFirst({
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
        }
        catch (error) {
            console.error('[CHECKOUT] Status check error:', error);
            return reply.status(400).send({ error: error.message });
        }
    });
    // ===================================================================
    // WEBHOOK ASAAS (receber notificações de pagamento)
    // ===================================================================
    app.post('/webhooks/asaas', async (request, reply) => {
        try {
            const payload = request.body;
            console.log('[ASAAS WEBHOOK] Received:', JSON.stringify(payload, null, 2));
            const { event, payment } = payload;
            if (!payment || !payment.externalReference) {
                console.log('[ASAAS WEBHOOK] No payment or externalReference');
                return reply.send({ received: true });
            }
            const orderId = payment.externalReference;
            // Buscar order
            const order = await prisma_1.prisma.order.findUnique({
                where: { id: orderId },
                include: { items: true },
            });
            if (!order) {
                console.log('[ASAAS WEBHOOK] Order not found:', orderId);
                return reply.send({ received: true });
            }
            // Atualizar status baseado no evento
            let paymentStatus = 'PENDING';
            let orderStatus = 'PENDING';
            if (event === 'PAYMENT_RECEIVED' || event === 'PAYMENT_CONFIRMED') {
                paymentStatus = 'CONFIRMED';
                orderStatus = 'COMPLETED';
            }
            else if (event === 'PAYMENT_OVERDUE' || event === 'PAYMENT_DELETED') {
                paymentStatus = 'CANCELED';
                orderStatus = 'CANCELED';
            }
            else if (event === 'PAYMENT_REFUNDED' || event === 'PAYMENT_REFUND_IN_PROGRESS') {
                paymentStatus = 'CANCELED';
                orderStatus = 'CANCELED';
            }
            // Atualizar order
            await prisma_1.prisma.order.update({
                where: { id: orderId },
                data: {
                    paymentStatus,
                    status: orderStatus,
                },
            });
            // Se pagamento confirmado, criar matrícula no curso
            // Para ebooks, a compra é rastreada via OrderItem automaticamente
            if (paymentStatus === 'CONFIRMED' && order.userId) {
                const courseItem = order.items.find(item => item.courseId);
                const ebookItem = order.items.find(item => item.ebookId);
                // Criar matrícula de curso
                if (courseItem && courseItem.courseId) {
                    // Verificar se já existe matrícula
                    const existingEnrollment = await prisma_1.prisma.courseEnrollment.findFirst({
                        where: {
                            userId: order.userId,
                            courseId: courseItem.courseId,
                        },
                    });
                    if (!existingEnrollment) {
                        await prisma_1.prisma.courseEnrollment.create({
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
            }
            return reply.send({ received: true });
        }
        catch (error) {
            console.error('[ASAAS WEBHOOK] Error:', error);
            return reply.status(200).send({ received: true }); // Sempre retorna 200 para não reenviar
        }
    });
};
exports.default = paymentRoutes;
//# sourceMappingURL=payments.js.map