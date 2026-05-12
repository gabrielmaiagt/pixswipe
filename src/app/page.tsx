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
import { ShinyButton } from '@/components/ui/shiny-button';
import { PlasticButton } from '@/components/ui/plastic-button';
import { MotionButton } from '@/components/ui/motion-button';
import { ContainerScroll } from '@/components/ui/container-scroll-animation';
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
          <img src="/logo.png" alt="Vortex Swipe" style={{ height: '56px', width: 'auto' }} />
        </div>
        <div className={styles.navLinks}>
          <Link href="/login" style={{ textDecoration: 'none' }}>
            <MotionButton label="Entrar" />
          </Link>
          <Link href="/#precos" style={{ textDecoration: 'none' }}>
            <PlasticButton text="Assinar" />
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

          <motion.div className={styles.heroBenefits} variants={fadeUp}>
            <div className={styles.heroBenefit}>
              <span>Ofertas Validadas</span>
            </div>
            <div className={styles.heroBenefit}>
              <span>Criativos Escalados</span>
            </div>
            <div className={styles.heroBenefit}>
              <span>Funil de Vendas Completos</span>
            </div>
            <div className={styles.heroBenefit}>
              <span>Comunidade Exclusiva</span>
            </div>
          </motion.div>

          <motion.div className={styles.heroCtas} variants={fadeUp}>
            <Link href="/#precos" style={{ textDecoration: 'none' }}>
              <ShinyButton>
                Começar Agora
              </ShinyButton>
            </Link>
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
            Acesse o ecossistema completo que os top players escondem para escalar em múltiplos modelos de negócio.
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
            3 passos simples para começar a vender ainda hoje!
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

          <div style={{
            marginTop: '3rem',
            borderRadius: '24px',
            overflow: 'hidden',
            border: '1px solid rgba(255,255,255,0.10)',
            boxShadow: '0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(140,82,255,0.1)',
            background: '#1a1a25',
            padding: '8px',
            maxWidth: '900px',
            margin: '3rem auto 0',
          }}>
            <img
              src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop"
              alt="Dashboard"
              style={{
                width: '100%',
                borderRadius: '18px',
                display: 'block',
                objectFit: 'cover',
                maxHeight: '420px',
                objectPosition: 'center',
              }}
              draggable={false}
            />
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
            Do X1 automático à escala global em dólar.
          </motion.p>

          <div className={styles.pricingGrid}>
            {PLANS.map((plan, i) => (
              <motion.div
                key={i}
                className={`${styles.pricingCard} ${plan.featured ? styles.pricingCardFeatured : ''} ${plan.id === 'elite' ? styles.pricingCardElite : ''}`}
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
            Teste o Vortex Swipe por 7 dias. Se não gostar, devolvemos 100% do seu
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
                  {testimonial.image ? (
                    <img src={testimonial.image} alt={testimonial.name} className={styles.testimonialAvatar} />
                  ) : (
                    <div className={styles.testimonialAvatar}>
                      {testimonial.initials}
                    </div>
                  )}
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
            Pronto para construir uma operação sólida?
          </motion.h2>
          <motion.p variants={fadeUp}>
            Junte-se aos players que estão escalando com previsibilidade no Brasil e no mundo.
          </motion.p>
          <motion.div variants={fadeUp}>
            <Button size="lg" onClick={() => handleSubscribe('pro')}>
              Assinar agora
            </Button>
          </motion.div>
        </motion.div>
      </section>

      {/* === Footer === */}
      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <div className={styles.footerLogo}>
            <img src="/logo.png" alt="Vortex Swipe" style={{ height: '48px', width: 'auto' }} />
          </div>
          <div className={styles.footerLinks}>
            <Link href="/termos">Termos de Uso</Link>
            <Link href="/privacidade">Política de Privacidade</Link>
            <Link href="/#precos">Planos</Link>
          </div>
          <p className={styles.footerCopy}>
            © {new Date().getFullYear()} Vortex Swipe. Todos os direitos reservados.
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
    title: 'Swipe De Ofertas',
    description: 'Ofertas validadas com tudo pronto: criativos, copy e estratégia de tráfego.',
  },
  {
    icon: <Image size={22} />,
    title: 'Criativos Prontos',
    description: 'Criativos que escalam, seja em imagem ou vídeo prontos para remodelar.',
  },
  {
    icon: <GraduationCap size={22} />,
    title: 'Aulas de implementação',
    description: 'Vídeo-aulas exclusivas explicando como rodar cada oferta passo a passo.',
  },
  {
    icon: <RefreshCw size={22} />,
    title: 'Atualizações semanais',
    description: 'Novas ofertas, criativos atualizados toda semana e adicionados manualmente.',
  },
];

const PREVIEW_OFFERS = [
  {
    title: 'SaaS Automação de WhatsApp',
    description: 'CAC médio: R$15,00 · LTV: R$450,00',
  },
  {
    title: 'Oferta Emagrecimento (Latam)',
    description: 'CPA médio: $4.50 · Ticket: $27.00',
  },
  {
    title: 'Funil Perpétuo — Renda Extra',
    description: 'CPA médio: R$35,00 · Ticket: R$147,00',
  },
];

const STEPS = [
  {
    title: 'Assine o Vortex Swipe',
    description: 'Escolha o plano ideal e tenha acesso imediato à bibliotecas completas de ofertas escaladas imediatamente.',
  },
  {
    title: 'Escolha uma oferta',
    description: 'Escolha uma oferta de sua preferencia, remodele criativos e funil.',
  },
  {
    title: 'Rode e fature',
    description: 'Suba os anúncios e comece faturar ainda hoje!',
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
    text: 'Achei que ia encontrar só os mesmos funis cansados de X1. Quando vi a esteira de Micro SaaS e Latam, minha operação mudou de nível em semanas.',
    name: 'Carlos Mendes',
    initials: 'CM',
    image: 'https://i.pravatar.cc/150?u=carlos',
    result: 'Faturando em Dólar na Latam',
  },
  {
    text: 'A facilidade de pegar VSLs prontas e páginas de altíssima conversão cortou meu custo de equipe pela metade. O tráfego direto ficou muito mais fácil.',
    name: 'Amanda Ribeiro',
    initials: 'AR',
    image: 'https://i.pravatar.cc/150?u=amanda',
    result: 'ROAS médio de 3.8x (Perpétuo)',
  },
  {
    text: 'Comecei pelo plano Starter no X1 para fazer caixa, reinvesti no Pro e agora já estou escalando minhas primeiras ofertas de Tráfego Direto.',
    name: 'Thiago Silva',
    initials: 'TS',
    image: 'https://i.pravatar.cc/150?u=thiago',
    result: 'Escalou do Zero ao Direto',
  },
];

const FAQS = [
  {
    question: 'Posso cancelar quando quiser?',
    answer: 'Sim! Você pode cancelar a qualquer momento. Seu acesso continua ativo até o fim do período já pago.',
  },
  {
    question: 'Serve apenas para X1?',
    answer: 'Não. Nossa plataforma se expandiu para oferecer a infraestrutura completa para Tráfego Direto, Micro SaaS e operações Globais (Latam), além do X1 tradicional.',
  },
  {
    question: 'Com que frequência saem novas ofertas?',
    answer: 'Publicamos novas ofertas, criativos e VSLs semanalmente, focando no que está funcionando agora no mercado.',
  },
  {
    question: 'Eu preciso saber espanhol para rodar na Latam?',
    answer: 'Não! Nossas ofertas Latam já vêm traduzidas, validadas e com os criativos prontos para você apenas subir a campanha.',
  },
  {
    question: 'O que são as ofertas de Micro SaaS?',
    answer: 'São pequenos softwares que resolvem problemas específicos e geram recorrência. Entregamos a estrutura para você vender essas soluções como afiliado ou parceiro de forma automatizada.',
  },
  {
    question: 'Vocês ensinam a subir as campanhas?',
    answer: 'Sim! Temos treinamentos exclusivos dentro da plataforma mostrando a exata configuração de campanhas para cada modelo (X1, Direto, Latam, etc).',
  },
];
