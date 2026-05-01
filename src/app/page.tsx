'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Zap,
  Image,
  MessageSquare,
  GraduationCap,
  RefreshCw,
  Lock,
  Check,
  X,
  ChevronDown,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Play,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { getCheckoutUrl } from '@/lib/cakto';
import styles from './landing.module.css';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } },
};

export default function LandingPage() {
  const { userData } = useAuth();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [settings, setSettings] = useState<any>(null);

  useState(() => {
    async function fetchSettings() {
      try {
        const { db } = await import('@/lib/firebase');
        const { doc, getDoc } = await import('firebase/firestore');
        const snap = await getDoc(doc(db, 'settings', 'general'));
        if (snap.exists()) {
          setSettings(snap.data());
        }
      } catch (err) {
        console.error('Error fetching settings:', err);
      }
    }
    fetchSettings();
  });

  const handleSubscribe = (planId: string) => {
    try {
      const url = getCheckoutUrl(planId as any, null, userData?.email, settings);
      window.location.href = url;
    } catch (err) {
      console.error('Checkout error:', err);
    }
  };

  return (
    <div className={styles.landing}>
      {/* === Navbar === */}
      <nav className={styles.navbar}>
        <div className={styles.navLogo}>
          <span>Pix</span> Swipe
        </div>
        <div className={styles.navLinks}>
          <Link href="/login">
            <Button variant="ghost" size="sm">Entrar</Button>
          </Link>
          <Link href="/#precos">
            <Button variant="primary" size="sm" icon={<Zap size={14} />}>
              Assinar
            </Button>
          </Link>
        </div>
      </nav>

      {/* === Hero === */}
      <section className={styles.hero}>
        <motion.div
          className={styles.heroContent}
          initial="hidden"
          animate="visible"
          variants={stagger}
        >
          <div className={styles.heroText}>
            <motion.h1 className={styles.heroTitle} variants={fadeUp}>
              Copie ofertas validadas e<br />
              <span>comece a vender hoje</span>
            </motion.h1>

            <motion.div className={styles.heroBenefits} variants={fadeUp}>
              <div className={styles.heroBenefit}>
                <Check size={16} />
                <span>Ofertas de X1 Validadas</span>
              </div>
              <div className={styles.heroBenefit}>
                <Check size={16} />
                <span>Criativos Escalados</span>
              </div>
              <div className={styles.heroBenefit}>
                <Check size={16} />
                <span>Funil de Vendas Completo</span>
              </div>
              <div className={styles.heroBenefit}>
                <Check size={16} />
                <span>Aulas Exclusivas De X1</span>
              </div>
            </motion.div>

            <motion.div className={styles.heroCtas} variants={fadeUp}>
              <Link href="/#precos">
                <Button size="lg" icon={<ArrowRight size={18} />}>
                  Começar Agora
                </Button>
              </Link>
              <Link href="#como-funciona">
                <Button variant="secondary" size="lg" icon={<Play size={18} />}>
                  Ver Como Funciona
                </Button>
              </Link>
            </motion.div>
          </div>

          <div className={styles.heroVisual}>
            <motion.div className={styles.heroPreview} variants={fadeUp}>
              <iframe
                width="100%"
                src="https://www.youtube.com/embed/1A33dpHNo-s"
                title="VSL"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className={styles.vslIframe}
              ></iframe>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* === Features === */}
      <section className={styles.features}>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={stagger}
        >
          <motion.h2 className={styles.sectionTitle} variants={fadeUp}>
            O que você recebe
          </motion.h2>
          <motion.p className={styles.sectionSubtitle} variants={fadeUp}>
            Tudo que você precisa para rodar ofertas X1 lucrativas
          </motion.p>

          <div className={styles.featuresGrid}>
            {FEATURES.map((feature, i) => (
              <motion.div
                key={i}
                className={styles.featureCard}
                variants={fadeUp}
              >
                <div className={styles.featureIcon}>{feature.icon}</div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>


      {/* === How It Works === */}
      <section className={styles.howItWorks} id="como-funciona">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={stagger}
        >
          <motion.h2 className={styles.sectionTitle} variants={fadeUp}>
            Como funciona
          </motion.h2>
          <motion.p className={styles.sectionSubtitle} variants={fadeUp}>
            3 passos simples para começar a vender
          </motion.p>

          <div className={styles.stepsGrid}>
            {STEPS.map((step, i) => (
              <motion.div key={i} className={styles.step} variants={fadeUp}>
                <div className={styles.stepNumber}>{i + 1}</div>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* === Pricing === */}
      <section className={styles.pricing} id="precos">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={stagger}
        >
          <motion.h2 className={styles.sectionTitle} variants={fadeUp}>
            Escolha seu plano
          </motion.h2>
          <motion.p className={styles.sectionSubtitle} variants={fadeUp}>
            Comece a rodar ofertas validadas agora mesmo
          </motion.p>

          <div className={styles.pricingGrid}>
            {PLANS.map((plan, i) => (
              <motion.div
                key={i}
                className={`${styles.pricingCard} ${plan.featured ? styles.pricingCardFeatured : ''}`}
                variants={fadeUp}
              >
                <div className={styles.pricingHeader}>
                  <h3>{plan.name}</h3>
                </div>
                <div className={styles.pricingBody}>
                  <div className={styles.pricingPrice}>
                    {plan.price}<span>R$</span>
                  </div>
                  <p className={styles.pricingPeriod}>{plan.subtitle}</p>
                  <ul className={styles.pricingFeatures}>
                    {plan.features.map((feature, j) => (
                      <li key={j}>
                        {feature.included ? (
                          <Check size={16} className={styles.pricingCheck} />
                        ) : (
                          <X size={16} className={styles.pricingX} />
                        )}
                        {feature.label}
                      </li>
                    ))}
                  </ul>
                  <button
                    className={styles.pricingCta}
                    onClick={() => handleSubscribe(plan.id)}
                  >
                    COMEÇAR AGORA
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* === Guarantee === */}
      <section className={styles.guarantee}>
        <motion.div
          className={styles.guaranteeContent}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={stagger}
        >
          <motion.div className={styles.guaranteeSeal} variants={fadeUp}>
            <span className={styles.guaranteeSealDays}>7</span>
            <span className={styles.guaranteeSealLabel}>dias</span>
          </motion.div>
          <motion.h3 className={styles.guaranteeTitle} variants={fadeUp}>
            Garantia <span>incondicional</span>
          </motion.h3>
          <motion.p className={styles.guaranteeText} variants={fadeUp}>
            Teste o Pix Swipe por 7 dias. Se não gostar, devolvemos 100% do seu
            dinheiro — sem perguntas, sem burocracia. Você não tem nada a perder.
          </motion.p>
        </motion.div>
      </section>

      {/* === Testimonials === */}
      <section className={styles.testimonials}>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={stagger}
        >
          <motion.h2 className={styles.sectionTitle} variants={fadeUp}>
            O que nossos membros dizem
          </motion.h2>
          <motion.p className={styles.sectionSubtitle} variants={fadeUp}>
            Resultados reais de quem já está rodando
          </motion.p>

          <div className={styles.testimonialsGrid}>
            {TESTIMONIALS.map((testimonial, i) => (
              <motion.div
                key={i}
                className={styles.testimonialCard}
                variants={fadeUp}
              >
                <p className={styles.testimonialText}>
                  &ldquo;{testimonial.text}&rdquo;
                </p>
                <div className={styles.testimonialAuthor}>
                  <div className={styles.testimonialAvatar}>
                    {testimonial.initials}
                  </div>
                  <div>
                    <div className={styles.testimonialName}>
                      {testimonial.name}
                    </div>
                    <div className={styles.testimonialResult}>
                      {testimonial.result}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* === FAQ === */}
      <section className={styles.faq}>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={stagger}
        >
          <motion.h2 className={styles.sectionTitle} variants={fadeUp}>
            Perguntas frequentes
          </motion.h2>
          <motion.p className={styles.sectionSubtitle} variants={fadeUp}>
            Tire suas dúvidas antes de assinar
          </motion.p>

          <div className={styles.faqList}>
            {FAQS.map((faq, i) => (
              <motion.div
                key={i}
                className={styles.faqItem}
                variants={fadeUp}
              >
                <button
                  className={styles.faqQuestion}
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  {faq.question}
                  <ChevronDown
                    size={18}
                    className={`${styles.faqChevron} ${openFaq === i ? styles.faqChevronOpen : ''}`}
                  />
                </button>
                {openFaq === i && (
                  <motion.div
                    className={styles.faqAnswer}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    {faq.answer}
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* === Final CTA === */}
      <section className={styles.finalCta}>
        <motion.div
          className={styles.finalCtaContent}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={stagger}
        >
          <motion.h2 variants={fadeUp}>
            Pronto para começar a rodar ofertas X1?
          </motion.h2>
          <motion.p variants={fadeUp}>
            Novos membros estão entrando toda semana. Não fique de fora.
          </motion.p>
          <motion.div variants={fadeUp}>
            <Button size="lg" icon={<Zap size={18} />} onClick={() => handleSubscribe('pro')}>
              Assinar agora
            </Button>
          </motion.div>
        </motion.div>
      </section>

      {/* === Footer === */}
      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <div className={styles.footerLogo}>
            <span>Pix</span> Swipe
          </div>
          <div className={styles.footerLinks}>
            <Link href="/termos">Termos de Uso</Link>
            <Link href="/privacidade">Política de Privacidade</Link>
            <Link href="/#precos">Planos</Link>
          </div>
          <p className={styles.footerCopy}>
            © {new Date().getFullYear()} Pix Swipe. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}

// === Static Data ===

const FEATURES = [
  {
    icon: <Zap size={22} />,
    title: 'Ofertas X1 prontas',
    description: 'Ofertas validadas com tudo pronto: criativos, copy e estratégia de tráfego.',
  },
  {
    icon: <Image size={22} />,
    title: 'Criativos para baixar',
    description: 'Imagens e vídeos prontos para subir direto nas suas campanhas.',
  },
  {
    icon: <MessageSquare size={22} />,
    title: 'Funil WhatsApp completo',
    description: 'Sequência de mensagens testadas para converter no X1.',
  },
  {
    icon: <GraduationCap size={22} />,
    title: 'Aulas de implementação',
    description: 'Vídeo-aulas explicando como rodar cada oferta passo a passo.',
  },
  {
    icon: <RefreshCw size={22} />,
    title: 'Atualizações semanais',
    description: 'Novas ofertas e criativos atualizados toda semana.',
  },
];

const PREVIEW_OFFERS = [
  {
    title: 'Oferta Emagrecimento — Chá Detox',
    description: 'CPL médio: R$2,50 · Ticket: R$14,90',
  },
  {
    title: 'Oferta Renda Extra — Mini Curso',
    description: 'CPL médio: R$1,80 · Ticket: R$12,90',
  },
  {
    title: 'Oferta Relacionamento — Guia PDF',
    description: 'CPL médio: R$3,20 · Ticket: R$9,90',
  },
];

const STEPS = [
  {
    title: 'Assine o Pix Swipe',
    description: 'Escolha o plano ideal e tenha acesso imediato à biblioteca completa.',
  },
  {
    title: 'Escolha uma oferta',
    description: 'Navegue pelas ofertas, baixe os criativos e copie o funil do WhatsApp.',
  },
  {
    title: 'Rode e fature',
    description: 'Suba os anúncios, ative o funil e comece a receber no Pix.',
  },
];

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: '97',
    period: 'mês',
    subtitle: 'Para quem está começando, no x1 automatico no WPP.',
    featured: false,
    popular: false,
    cta: 'Começar Agora',
    features: [
      { label: 'Ofertas de X1 validadas', included: true },
      { label: 'Criativos escalados', included: true },
      { label: 'Funis prontos ( so copiar e colar )', included: true },
      { label: 'Aulas Exclusivas De X1', included: true },
      { label: 'Comunidade VIP Players Que Escalam', included: true },
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '127',
    period: 'mês',
    subtitle: 'Para quem quer escalar, no trafego direto.',
    featured: true,
    popular: true,
    cta: 'Assinar Pro',
    features: [
      { label: 'Tudo do plano Starter', included: true },
      { label: 'Ofertas De Tráfego Direto/ Infoprodutos', included: true },
      { label: 'Criativos Escalados', included: true },
      { label: 'Ofertas White/Black/Hot', included: true },
      { label: 'Aulas Exclusivas Sobre Tráfego Direto', included: true },
      { label: 'Comunidade VIP Players Que Escalam', included: true },
      { label: 'Suporte prioritário', included: true },
    ],
  },
  {
    id: 'elite',
    name: 'Elite',
    price: '147',
    period: 'mês',
    subtitle: 'Pra quem quer escalar em dolar $.',
    featured: false,
    popular: false,
    cta: 'Assinar Elite',
    features: [
      { label: 'Tudo do Plano Pro/Starter', included: true },
      { label: 'Ofertas De Tráfego Direto Latam ( Global )', included: true },
      { label: 'Ofertas de Micro SAAS', included: true },
      { label: 'Criativos que escalam +7 digitos', included: true },
      { label: 'Aulas exclusivas sobre trafego direto global', included: true },
      { label: 'Networking Com Players Que Escalam', included: true },
    ],
  },
];

const TESTIMONIALS = [
  {
    text: 'Comecei do zero e em 2 semanas já estava recebendo Pix todo dia. As ofertas são muito bem estruturadas.',
    name: 'Lucas M.',
    initials: 'LM',
    result: 'R$4.200 no primeiro mês',
  },
  {
    text: 'Eu já rodava X1 mas gastava horas montando funil. Com o Pix Swipe, é copiar e colar. Meu ROAS triplicou.',
    name: 'Amanda R.',
    initials: 'AR',
    result: 'ROAS de 3.5x em média',
  },
  {
    text: 'O melhor investimento que fiz no digital. As aulas são diretas e as ofertas já vêm prontas com tudo.',
    name: 'Rafael S.',
    initials: 'RS',
    result: '12 vendas por dia em média',
  },
];

const FAQS = [
  {
    question: 'Posso cancelar quando quiser?',
    answer: 'Sim! Você pode cancelar a qualquer momento. Seu acesso continua ativo até o fim do período já pago.',
  },
  {
    question: 'Funciona para iniciantes?',
    answer: 'Sim! As aulas explicam todo o processo passo a passo, desde criar a conta de anúncios até configurar o funil no WhatsApp.',
  },
  {
    question: 'Com que frequência saem novas ofertas?',
    answer: 'Publicamos novas ofertas toda semana e atualizamos os criativos das ofertas existentes regularmente.',
  },
  {
    question: 'Preciso investir em tráfego pago?',
    answer: 'Sim, as ofertas são feitas para rodar com anúncios no Facebook/Instagram. Recomendamos começar com pelo menos R$30/dia.',
  },
  {
    question: 'As ofertas funcionam em todos os nichos?',
    answer: 'Temos ofertas nos nichos de emagrecimento, renda extra, relacionamento, saúde e outros. A biblioteca é atualizada semanalmente.',
  },
  {
    question: 'Posso usar as mesmas ofertas que outros membros?',
    answer: 'Sim! As ofertas são testadas para suportar múltiplos afiliados rodando ao mesmo tempo sem saturar.',
  },
];
