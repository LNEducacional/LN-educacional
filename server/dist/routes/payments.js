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
        courseId: zod_1.z.string(),
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
    });
    app.post('/checkout/create', { preHandler: app.authenticate }, async (request, reply) => {
        try {
            const body = createCheckoutSchema.parse(request.body);
            const userId = request.currentUser.id;
            // Buscar curso
            const course = await prisma_1.prisma.course.findUnique({
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
            const order = await prisma_1.prisma.order.create({
                data: {
                    userId,
                    totalAmount: course.price,
                    status: 'PENDING',
                    paymentStatus: 'PENDING',
                    paymentMethod: body.paymentMethod,
                    customerName: body.customer.name,
                    customerEmail: body.customer.email,
                    customerCpfCnpj: body.customer.cpfCnpj,
                    customerPhone: body.customer.phone || body.customer.mobilePhone,
                    items: {
                        create: {
                            courseId: course.id,
                            title: course.title,
                            description: course.description,
                            price: course.price,
                        },
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
                value: course.price / 100, // Converter centavos para reais
                dueDate: dueDateStr,
                description: `Curso: ${course.title}`,
                externalReference: order.id,
                installmentCount,
            };
            // Só adicionar installmentValue se houver parcelamento (> 1)
            if (installmentCount > 1) {
                chargeData.installmentValue = (course.price / 100) / installmentCount;
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
                // Se pagamento confirmado, criar matrícula
                if (creditCardPayment.status === 'CONFIRMED' || creditCardPayment.status === 'RECEIVED') {
                    await prisma_1.prisma.courseEnrollment.create({
                        data: {
                            userId,
                            courseId: body.courseId,
                            progress: 0,
                        },
                    });
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
                return reply.send({
                    success: true,
                    orderId: order.id,
                    chargeId: charge.id,
                    paymentMethod: body.paymentMethod,
                    pix: {
                        payload: pixData.payload,
                        qrCodeImage: pixData.encodedImage,
                        expirationDate: pixData.expirationDate,
                    },
                });
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
            if (paymentStatus === 'CONFIRMED' && order.userId) {
                const courseItem = order.items.find(item => item.courseId);
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