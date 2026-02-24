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

  const handleSubscribe = (planId: string) => {
    try {
      const url = getCheckoutUrl(planId as any, null, userData?.email);
      window.location.href = url;
    } catch (err) {
      console.error('Checkout error:', err);
      // Fallback or toast if URL not configured
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
          <motion.div className={styles.heroTag} variants={fadeUp}>
            <Sparkles size={14} />
            Ofertas X1 prontas para rodar
          </motion.div>

          <motion.h1 className={styles.heroTitle} variants={fadeUp}>
            Copie ofertas validadas e<br />
            <span>comece a vender hoje</span>
          </motion.h1>

          <motion.p className={styles.heroSubtitle} variants={fadeUp}>
            Biblioteca de ofertas X1 completas — criativos, funil do WhatsApp,
            e tutorial de implementação. Pague, copie e saia rodando.
          </motion.p>

          <motion.div className={styles.heroCtas} variants={fadeUp}>
            <Link href="/#precos">
              <Button size="lg" icon={<ArrowRight size={18} />}>
                Começar agora
              </Button>
            </Link>
            <Link href="#como-funciona">
              <Button variant="secondary" size="lg">
                Como funciona
              </Button>
            </Link>
          </motion.div>

          <motion.div className={styles.heroPreview} variants={fadeUp}>
            <div className={styles.heroPreviewBlur}>
              <div className={styles.heroPreviewInner}>
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className={styles.heroPreviewCard} />
                ))}
              </div>
            </div>
          </motion.div>
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

      {/* === Preview Cards === */}
      <section className={styles.preview}>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={stagger}
        >
          <motion.h2 className={styles.sectionTitle} variants={fadeUp}>
            Ofertas prontas para copiar
          </motion.h2>
          <motion.p className={styles.sectionSubtitle} variants={fadeUp}>
            Veja um preview do que está dentro da plataforma
          </motion.p>

          <div className={styles.previewGrid}>
            {PREVIEW_OFFERS.map((offer, i) => (
              <motion.div
                key={i}
                className={styles.previewCard}
                variants={fadeUp}
              >
                <div className={styles.lockBadge}>
                  <Lock size={10} /> Membros
                </div>
                <div className={styles.previewCardImage}>
                  <TrendingUp size={32} style={{ color: 'var(--text-muted)' }} />
                </div>
                <div className={styles.previewCardBody}>
                  <h3>{offer.title}</h3>
                  <p>{offer.description}</p>
                </div>
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
                {plan.popular && (
                  <div className={styles.pricingPopular}>Mais popular</div>
                )}
                <h3>{plan.name}</h3>
                <div className={styles.pricingPrice}>
                  R${plan.price}
                  <span>/{plan.period}</span>
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
                <Button
                  variant={plan.featured ? 'primary' : 'secondary'}
                  fullWidth
                  onClick={() => handleSubscribe(plan.id)}
                >
                  {plan.cta}
                </Button>
              </motion.div>
            ))}
          </div>
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
    price: '37',
    period: 'mês',
    subtitle: 'Para quem está começando',
    featured: false,
    popular: false,
    cta: 'Começar com Starter',
    features: [
      { label: 'Ofertas básicas', included: true },
      { label: 'Criativos básicos', included: true },
      { label: 'Aulas dos módulos iniciais', included: true },
      { label: 'Comentários na comunidade', included: true },
      { label: 'Todas as ofertas', included: false },
      { label: 'Criativos premium', included: false },
      { label: 'Badge Pro', included: false },
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '97',
    period: 'mês',
    subtitle: 'Para quem quer escalar',
    featured: true,
    popular: true,
    cta: 'Assinar Pro',
    features: [
      { label: 'Todas as ofertas publicadas', included: true },
      { label: 'Todos os criativos', included: true },
      { label: 'Todas as aulas', included: true },
      { label: 'Comentários na comunidade', included: true },
      { label: 'Badge Pro no perfil', included: true },
      { label: 'Acesso prioritário', included: false },
      { label: 'Badge Anual', included: false },
    ],
  },
  {
    id: 'annual',
    name: 'Anual',
    price: '797',
    period: 'ano',
    subtitle: 'Economia de 30%+',
    featured: false,
    popular: false,
    cta: 'Assinar Anual',
    features: [
      { label: 'Tudo do Pro incluído', included: true },
      { label: 'Todas as ofertas e criativos', included: true },
      { label: 'Todas as aulas', included: true },
      { label: 'Acesso prioritário a novas ofertas', included: true },
      { label: 'Badge Anual exclusivo', included: true },
      { label: 'Economia de R$367 por ano', included: true },
      { label: 'Suporte prioritário', included: true },
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
