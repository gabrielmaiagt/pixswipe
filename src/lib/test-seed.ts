// ===========================
// Test Seed Data — Modo Teste
// Creates realistic Firestore data with isTestData: true
// ===========================

import {
    collection,
    doc,
    getDocs,
    query,
    where,
    writeBatch,
    Timestamp,
    setDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

// --- Helpers ---
const TEST_PREFIX = 'test_';

function testId(index: number, prefix: string) {
    return `${TEST_PREFIX}${prefix}_${String(index).padStart(3, '0')}`;
}

function randomDate(daysAgo: number): Timestamp {
    const d = new Date();
    d.setDate(d.getDate() - Math.floor(Math.random() * daysAgo));
    d.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));
    return Timestamp.fromDate(d);
}

function pick<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

function rand(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// --- Seed Counts ---
export interface SeedCounts {
    offers: number;
    modules: number;
    lessons: number;
    users: number;
    payments: number;
    webhookLogs: number;
    supportTickets: number;
    affiliates: number;
    notifications: number;
    creatives: number;
    funnelSteps: number;
}

// --- Seed Data Generators ---

const NICHES = ['emagrecimento', 'renda-extra', 'relacionamento', 'saúde', 'finanças', 'produtividade', 'beleza', 'educação'];
const OFFER_TITLES = [
    'Chá Detox Transformador — Perca até 8kg em 30 dias',
    'Mini Curso Renda Extra',
    'Guia Relacionamento Blindado',
    'Método Faturamento Digital',
    'Protocolo Barriga Zero',
    'Kit Copy Matadora X1',
    'Funil WhatsApp Automático',
    'Curso Tráfego Direto',
    'Desafio 21 Dias — Corpo Novo',
    'Super Planilha Financeira — Controle Total dos Seus Gastos Mensais e Investimentos com Projeção de Crescimento',
    'E-book Receitas Fit',
    'Workshop Vendas Online Express — Método Comprovado Para Escalar de 0 a 10k Por Mês Com Tráfego Pago e Marketing Digital',
];

const OFFER_PROMISES = [
    'Perca peso de forma saudável e natural com nosso método comprovado.',
    'Aprenda a gerar renda extra trabalhando apenas 2h por dia no conforto da sua casa.',
    'Reconquiste a confiança no seu relacionamento com técnicas de comunicação assertiva.',
    'Domine o marketing digital e fature alto com ofertas X1.',
    'Elimine a gordura abdominal com exercícios de 15 minutos, sem academia, sem equipamento.',
    'Copie textos de venda que convertem e saia rodando em menos de 24 horas. Este é um texto propositalmente muito longo para testar o overflow da UI e verificar se o truncamento funciona corretamente em todas as seções do sistema, incluindo cards, modals, tabelas e listas.',
    'Automatize seu funil de vendas no WhatsApp e receba enquanto dorme.',
    'Escale suas campanhas com tráfego direto otimizado para alta performance.',
];

const MODULE_TITLES = [
    'Introdução ao Método', 'Fundamentos de Tráfego Pago', 'Dominando o WhatsApp Business',
    'Criando Anúncios que Convertem', 'Copy para X1 — Do Zero ao Avançado', 'Funis de Venda Automáticos',
    'Escala e Otimização de Campanhas', 'Análise de Métricas e KPIs', 'Estratégias Avançadas de Retargeting',
    'Mentalidade do Digital — Produtividade e Consistência no Trabalho Online Para Resultados Duradouros',
    'Módulo Bônus',
];

const LESSON_TITLES = [
    'Boas-vindas', 'O que você vai aprender', 'Configurando sua conta', 'Primeiros passos',
    'Criando sua primeira campanha', 'Segmentação de público', 'Orçamento e lances',
    'Criativos que performam', 'Análise de resultados', 'Otimizando CTR',
    'Funil de qualificação', 'Script de vendas', 'Fechamento no WhatsApp',
    'Copy persuasiva', 'Headline matadora', 'CTA irresistível',
    'Setup completo', 'Aula muito longa — Como dominar completamente todas as estratégias de retargeting avançado para maximizar ROI em campanhas multicanal',
    'Recapitulação e próximos passos', 'Bônus exclusivo',
];

const USER_NAMES = [
    'Lucas Martins', 'Amanda Rodrigues', 'Rafael Santos', 'Juliana Costa',
    'Pedro Almeida', 'Camila Ferreira', 'Gabriel Nascimento', 'Beatriz Oliveira',
    'Thiago Lima', 'Maria Silva', 'Fernando Cardoso', 'Ana Paula Ribeiro',
    'Carlos Eduardo', 'Letícia Mendes', 'Marcos Vinícius', 'Patrícia Gomes',
    'Diego Barbosa', 'Larissa Monteiro', 'Bruno Pereira', 'Isabela Souza',
    'João Victor Araújo', 'Daniela Correia', 'Mateus Pinto', 'Renata Lima',
    'Henrique Castro', 'Vanessa Reis', 'Felipe Torres', 'Marina Duarte',
    'Ricardo Melo', 'Priscila Andrade',
];

const TAGS = ['x1', 'tráfego direto', 'iniciante', 'avançado', 'high-ticket', 'low-ticket', 'whatsapp', 'instagram', 'facebook', 'escala'];

// ===========================
// SEED FUNCTION
// ===========================

export async function seedTestData(
    onProgress?: (msg: string) => void
): Promise<SeedCounts> {
    const log = (m: string) => onProgress?.(m);
    const counts: SeedCounts = {
        offers: 0, modules: 0, lessons: 0, users: 0, payments: 0,
        webhookLogs: 0, supportTickets: 0, affiliates: 0, notifications: 0,
        creatives: 0, funnelSteps: 0,
    };

    // --- Delete existing seed first (idempotent) ---
    log('Limpando seed existente...');
    await deleteTestData();

    // --- 1. OFFERS (10) ---
    log('Criando ofertas...');
    const OFFER_COUNT = 10;
    for (let i = 0; i < OFFER_COUNT; i++) {
        const offerId = testId(i, 'offer');
        const status = i < 7 ? 'published' : i === 7 ? 'draft' : 'archived';
        const plans: ('starter' | 'pro' | 'annual')[] =
            i < 3 ? ['starter', 'pro', 'annual'] :
                i < 7 ? ['pro', 'annual'] : ['annual'];

        const offerData = {
            title: OFFER_TITLES[i % OFFER_TITLES.length],
            niche: NICHES[i % NICHES.length],
            ticket: pick([9.9, 12.9, 14.9, 19.9, 27, 37, 47, 97]),
            status,
            summary: {
                promise: OFFER_PROMISES[i % OFFER_PROMISES.length],
                mechanism: 'Método testado e validado com mais de 500 alunos.',
                audience: 'Homens e mulheres de 25 a 55 anos interessados em ' + NICHES[i % NICHES.length],
                objections: 'Funciona mesmo para quem nunca trabalhou com internet.',
            },
            tags: [TAGS[i % TAGS.length], TAGS[(i + 3) % TAGS.length], TAGS[(i + 5) % TAGS.length]],
            createdAt: randomDate(180),
            updatedAt: randomDate(30),
            publishedAt: status === 'published' ? randomDate(90) : null,
            availableOnPlans: plans,
            featured: i === 1 || i === 4,
            scalingBadge: i === 2 || i === 5,
            referenceCpl: parseFloat((Math.random() * 5 + 1).toFixed(2)),
            referenceRoas: parseFloat((Math.random() * 4 + 1).toFixed(1)),
            referenceTicket: pick([9.9, 14.9, 19.9, 27, 37]),
            views: rand(50, 5000),
            saves: rand(5, 300),
            version: rand(1, 5),
            lastUpdatedNote: i % 3 === 0 ? 'Criativos atualizados' : null,
            creativeStorageType: 'drive',
            thumbnailUrl: i % 4 === 0 ? null : `https://placehold.co/600x400/1a1a2e/00d4aa?text=Oferta+${i + 1}`,
            isTestData: true,
        };

        await setDoc(doc(db, 'offers', offerId), offerData);
        counts.offers++;

        // Creatives for each offer (3-5)
        const creativeBatch = writeBatch(db);
        const creativeCount = rand(3, 5);
        for (let c = 0; c < creativeCount; c++) {
            const cId = testId(c, `ofr${i}_creative`);
            creativeBatch.set(doc(db, 'offers', offerId, 'creatives', cId), {
                type: pick(['image', 'video', 'text']),
                driveUrl: `https://drive.google.com/placeholder-${i}-${c}`,
                caption: c === 0
                    ? '🔥 Copy muito longa para testar overflow — Descubra como esse método revolucionário pode transformar sua vida financeira em apenas 7 dias com resultados comprovados por mais de mil alunos que já mudaram suas vidas completamente.'
                    : `✅ Criativo ${c + 1} — ${OFFER_TITLES[i % OFFER_TITLES.length]}`,
                tags: [pick(TAGS), pick(TAGS)],
                isTestData: true,
            });
            counts.creatives++;
        }
        await creativeBatch.commit();

        // Funnel steps (4-6)
        const funnelBatch = writeBatch(db);
        const funnelLabels: ('qualificacao' | 'prova' | 'pitch' | 'fechamento')[] = ['qualificacao', 'prova', 'pitch', 'fechamento'];
        const funnelCount = rand(4, 6);
        for (let f = 0; f < funnelCount; f++) {
            const fId = testId(f, `ofr${i}_funnel`);
            funnelBatch.set(doc(db, 'offers', offerId, 'funnelSteps', fId), {
                order: f + 1,
                text: f === 2
                    ? 'Olá! 👋 Tudo bem? Vi que você se interessou pelo nosso método! Posso te explicar em detalhes como funciona? São apenas 3 passos simples que vão mudar completamente a sua forma de trabalhar online. Muitas pessoas conseguem resultados já na primeira semana, e o mais incrível é que você não precisa de nenhuma experiência anterior. Quer saber mais?'
                    : `Mensagem ${f + 1} do funil — ${funnelLabels[f % funnelLabels.length]}`,
                delayMinutes: f * pick([5, 10, 15, 30, 60]),
                label: funnelLabels[f % funnelLabels.length],
                isTestData: true,
            });
            counts.funnelSteps++;
        }
        await funnelBatch.commit();
    }

    // --- 2. MODULES (5) ---
    log('Criando módulos...');
    const MODULE_COUNT = 5;
    for (let m = 0; m < MODULE_COUNT; m++) {
        const moduleId = testId(m, 'module');
        await setDoc(doc(db, 'modules', moduleId), {
            title: MODULE_TITLES[m % MODULE_TITLES.length],
            description: m === 3
                ? 'Módulo propositalmente com descrição extremamente longa para testar a renderização em cards, listas e tabelas do admin. Este módulo cobre todos os conceitos avançados necessários para dominar completamente a arte de criar campanhas de marketing digital otimizadas para alta performance e retorno máximo sobre investimento em múltiplas plataformas simultaneamente.'
                : `Aprenda os fundamentos de ${MODULE_TITLES[m % MODULE_TITLES.length].toLowerCase()}.`,
            order: m + 1,
            status: m < 4 ? 'published' : 'draft',
            coverUrl: m === 2 ? null : `https://placehold.co/400x300/1a1a2e/00d4aa?text=Módulo+${m + 1}`,
            isTestData: true,
        });
        counts.modules++;

        // Lessons per module (5-10, except last module = 0 lessons to test empty state)
        if (m === MODULE_COUNT - 1) continue; // Empty module

        const lessonCount = rand(5, 10);
        const lessonBatch = writeBatch(db);
        for (let l = 0; l < lessonCount; l++) {
            const lessonId = testId(l, `mod${m}_lesson`);
            const lessonStatus = l < lessonCount - 1 ? 'published' : 'draft';
            const plans: ('starter' | 'pro' | 'annual')[] =
                m < 2 ? ['starter', 'pro', 'annual'] : ['pro', 'annual'];

            lessonBatch.set(doc(db, 'lessons', lessonId), {
                title: LESSON_TITLES[l % LESSON_TITLES.length],
                description: l === 0
                    ? 'Descrição curta.'
                    : `Nesta aula, vamos aprender sobre ${LESSON_TITLES[l % LESSON_TITLES.length].toLowerCase()} com exemplos práticos e exercícios.`,
                videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                thumbnailUrl: l % 3 === 0 ? null : `https://placehold.co/320x180/1a1a2e/00d4aa?text=Aula+${l + 1}`,
                duration: rand(180, 3600),
                order: l + 1,
                moduleId,
                status: lessonStatus,
                availableOnPlans: plans,
                createdAt: randomDate(120),
                isTestData: true,
            });
            counts.lessons++;
        }
        await lessonBatch.commit();
    }

    // --- 3. USERS (30) ---
    log('Criando usuários fictícios...');
    const USER_COUNT = 30;
    const userBatch1 = writeBatch(db);
    const userBatch2 = writeBatch(db);
    for (let u = 0; u < USER_COUNT; u++) {
        const userId = testId(u, 'user');
        const plan: ('starter' | 'pro' | 'annual') = u < 10 ? 'starter' : u < 22 ? 'pro' : 'annual';
        const entStatus: ('active' | 'past_due' | 'canceled' | 'expired') =
            u < 20 ? 'active' : u < 25 ? 'past_due' : u < 28 ? 'canceled' : 'expired';

        const userData = {
            uid: userId,
            name: USER_NAMES[u % USER_NAMES.length],
            email: `teste${u + 1}@pixswipe.test`,
            role: u === 0 ? 'admin' : 'user',
            createdAt: randomDate(365),
            plan,
            entitlementStatus: entStatus,
            currentPeriodEnd: Timestamp.fromDate(new Date(Date.now() + rand(-30, 60) * 86400000)),
            onboarding: {
                niches: [NICHES[u % NICHES.length], NICHES[(u + 2) % NICHES.length]],
                level: pick(['iniciante', 'ja_rodo_x1', 'avancado']),
                goal: pick(['comecar_do_zero', 'escalar', 'diversificar']),
                completed: u < 25,
            },
            metrics: {
                offersViewed: rand(0, 200),
                lessonsDone: rand(0, 50),
                totalTimeMinutes: rand(0, 3000),
                lastSeen: randomDate(14),
            },
            affiliateCode: `AFF${userId.toUpperCase().slice(-6)}`,
            isTestData: true,
        };

        if (u < 15) {
            userBatch1.set(doc(db, 'users', userId), userData);
        } else {
            userBatch2.set(doc(db, 'users', userId), userData);
        }
        counts.users++;
    }
    await userBatch1.commit();
    await userBatch2.commit();

    // --- 4. PAYMENTS (40) ---
    log('Criando pagamentos...');
    const PAYMENT_COUNT = 40;
    const payBatch1 = writeBatch(db);
    const payBatch2 = writeBatch(db);
    for (let p = 0; p < PAYMENT_COUNT; p++) {
        const payId = testId(p, 'payment');
        const payStatus = p < 28 ? 'approved' : p < 35 ? 'pending' : 'canceled';
        const payData = {
            uid: testId(p % USER_COUNT, 'user'),
            caktoSaleId: `cakto_test_${p}`,
            amount: pick([37, 97, 797, 37, 37, 97]),
            plan: pick(['starter', 'pro', 'annual']),
            status: payStatus,
            createdAt: randomDate(180),
            isTestData: true,
        };

        if (p < 20) {
            payBatch1.set(doc(db, 'payments', payId), payData);
        } else {
            payBatch2.set(doc(db, 'payments', payId), payData);
        }
        counts.payments++;
    }
    await payBatch1.commit();
    await payBatch2.commit();

    // --- 5. WEBHOOK LOGS (20) ---
    log('Criando webhook logs...');
    const WH_COUNT = 20;
    const whBatch = writeBatch(db);
    for (let w = 0; w < WH_COUNT; w++) {
        const whId = testId(w, 'webhook');
        const whStatus = w < 14 ? 'ok' : w < 17 ? 'failed' : 'retried';
        whBatch.set(doc(db, 'webhookLogs', whId), {
            event: pick(['payment.approved', 'payment.declined', 'subscription.canceled', 'subscription.renewed', 'affiliate.sale']),
            payload: { test: true, index: w },
            status: whStatus,
            error: whStatus === 'failed' ? 'Timeout ao processar webhook — erro simulado para teste de UI' : null,
            receivedAt: randomDate(30),
            processedAt: whStatus !== 'failed' ? randomDate(30) : null,
            isTestData: true,
        });
        counts.webhookLogs++;
    }
    await whBatch.commit();

    // --- 6. SUPPORT TICKETS (15) ---
    log('Criando tickets de suporte...');
    const TICKET_COUNT = 15;
    const ticketBatch = writeBatch(db);
    const subjects = [
        'Não consigo acessar o módulo 3',
        'Pagamento não foi confirmado',
        'Vídeo não carrega na aula 5',
        'Quero trocar de plano',
        'Bug no funil de WhatsApp — mensagem não aparece completa na visualização mobile, cortando o texto após 3 linhas o que prejudica a experiência',
        'Dúvida sobre afiliados',
        'Link de criativo quebrado',
        'Erro ao baixar PDF',
        'Sugestão de melhoria',
        'Problema com o checkout',
        'Aula duplicada',
        'Badge não aparece no perfil',
        'Notificação não chegou',
        'Ajuda',
        'Questão urgente sobre cancelamento e reembolso proporcional do plano anual considerando que estou no terceiro mês de uso',
    ];
    for (let t = 0; t < TICKET_COUNT; t++) {
        const tId = testId(t, 'ticket');
        ticketBatch.set(doc(db, 'supportTickets', tId), {
            userId: testId(t % USER_COUNT, 'user'),
            subject: subjects[t % subjects.length],
            message: t === 4
                ? 'Mensagem muito longa para testar truncamento na tabela. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.'
                : `Descrição do problema #${t + 1} — preciso de ajuda com ${subjects[t % subjects.length].toLowerCase()}.`,
            status: t < 8 ? 'open' : 'closed',
            createdAt: randomDate(60),
            isTestData: true,
        });
        counts.supportTickets++;
    }
    await ticketBatch.commit();

    // --- 7. AFFILIATES (8) ---
    log('Criando afiliados...');
    const AFF_COUNT = 8;
    const affBatch = writeBatch(db);
    for (let a = 0; a < AFF_COUNT; a++) {
        const affUserId = testId(a, 'user');
        affBatch.set(doc(db, 'affiliates', affUserId), {
            uid: affUserId,
            affiliateCode: `TESTCODE${a + 1}`,
            totalClicks: rand(50, 5000),
            totalSales: rand(0, 50),
            totalEarnings: parseFloat((Math.random() * 5000).toFixed(2)),
            paymentStatus: a < 5 ? 'pending' : 'paid',
            referrals: Array.from({ length: rand(0, 5) }, (_, ri) => ({
                uid: testId(rand(0, USER_COUNT - 1), 'user'),
                plan: pick(['starter', 'pro', 'annual']),
                date: randomDate(90),
                amount: pick([37, 97, 797]),
                commission: pick([11.1, 29.1, 239.1]),
            })),
            isTestData: true,
        });
        counts.affiliates++;
    }
    await affBatch.commit();

    log('✅ Seed completo!');
    return counts;
}

// ===========================
// DELETE FUNCTION
// ===========================

const COLLECTIONS_TO_CLEAN = [
    'offers',
    'modules',
    'lessons',
    'users',
    'payments',
    'webhookLogs',
    'supportTickets',
    'affiliates',
];

const SUBCOLLECTIONS: Record<string, string[]> = {
    offers: ['creatives', 'funnelSteps', 'comments'],
    lessons: ['comments'],
};

export async function deleteTestData(
    onProgress?: (msg: string) => void
): Promise<number> {
    const log = (m: string) => onProgress?.(m);
    let totalDeleted = 0;

    for (const col of COLLECTIONS_TO_CLEAN) {
        log?.(`Limpando ${col}...`);
        const snap = await getDocs(
            query(collection(db, col), where('isTestData', '==', true))
        );

        if (snap.empty) continue;

        // Delete subcollections first
        const subs = SUBCOLLECTIONS[col] || [];
        for (const subCol of subs) {
            for (const parentDoc of snap.docs) {
                const subSnap = await getDocs(collection(db, col, parentDoc.id, subCol));
                if (!subSnap.empty) {
                    const subBatch = writeBatch(db);
                    subSnap.docs.forEach((d) => subBatch.delete(d.ref));
                    await subBatch.commit();
                    totalDeleted += subSnap.size;
                }
            }
        }

        // Delete parent docs in batches of 400
        const docs = snap.docs;
        for (let i = 0; i < docs.length; i += 400) {
            const batch = writeBatch(db);
            docs.slice(i, i + 400).forEach((d) => batch.delete(d.ref));
            await batch.commit();
            totalDeleted += Math.min(400, docs.length - i);
        }
    }

    log?.(`✅ ${totalDeleted} documentos removidos`);
    return totalDeleted;
}

// ===========================
// CHECK FUNCTION
// ===========================

export async function checkTestSeedExists(): Promise<SeedCounts | null> {
    try {
        const offersSnap = await getDocs(
            query(collection(db, 'offers'), where('isTestData', '==', true))
        );
        if (offersSnap.empty) return null;

        const modulesSnap = await getDocs(query(collection(db, 'modules'), where('isTestData', '==', true)));
        const lessonsSnap = await getDocs(query(collection(db, 'lessons'), where('isTestData', '==', true)));
        const usersSnap = await getDocs(query(collection(db, 'users'), where('isTestData', '==', true)));
        const paymentsSnap = await getDocs(query(collection(db, 'payments'), where('isTestData', '==', true)));
        const webhooksSnap = await getDocs(query(collection(db, 'webhookLogs'), where('isTestData', '==', true)));
        const ticketsSnap = await getDocs(query(collection(db, 'supportTickets'), where('isTestData', '==', true)));
        const affiliatesSnap = await getDocs(query(collection(db, 'affiliates'), where('isTestData', '==', true)));

        return {
            offers: offersSnap.size,
            modules: modulesSnap.size,
            lessons: lessonsSnap.size,
            users: usersSnap.size,
            payments: paymentsSnap.size,
            webhookLogs: webhooksSnap.size,
            supportTickets: ticketsSnap.size,
            affiliates: affiliatesSnap.size,
            notifications: 0,
            creatives: 0,
            funnelSteps: 0,
        };
    } catch {
        return null;
    }
}
