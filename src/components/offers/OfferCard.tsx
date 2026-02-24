'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    TrendingUp,
    Eye,
    Bookmark,
    BookmarkCheck,
    Lock,
    Star,
    Flame,
    DollarSign,
} from 'lucide-react';
import type { Offer, PlanType } from '@/types';
import styles from './OfferCard.module.css';

interface OfferCardProps {
    offer: Offer;
    userPlan?: PlanType;
    isSaved?: boolean;
    onToggleSave?: (offerId: string) => void;
}

const planColors: Record<string, string> = {
    starter: 'var(--plan-starter)',
    pro: 'var(--plan-pro)',
    annual: 'var(--plan-annual)',
};

export default function OfferCard({
    offer,
    userPlan,
    isSaved = false,
    onToggleSave,
}: OfferCardProps) {
    const hasAccess =
        !userPlan || offer.availableOnPlans.includes(userPlan);

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={styles.offerCard}
        >
            <Link href={hasAccess ? `/app/ofertas/${offer.id}` : '#'}>
                {/* Thumbnail */}
                <div className={styles.thumbnail}>
                    {offer.thumbnailUrl ? (
                        <img
                            src={offer.thumbnailUrl}
                            alt={offer.title}
                            className={styles.thumbnailImage}
                        />
                    ) : (
                        <TrendingUp size={36} className={styles.thumbnailPlaceholder} />
                    )}

                    {/* Top badges */}
                    <div className={styles.topBadges}>
                        <span className={styles.nicheBadge}>{offer.niche}</span>
                        {offer.scalingBadge && (
                            <span className={styles.scalingBadge}>
                                <Flame size={10} /> Escalando
                            </span>
                        )}
                        {offer.featured && (
                            <span className={styles.featuredBadge}>
                                <Star size={10} /> Destaque
                            </span>
                        )}
                    </div>

                    {/* Save button */}
                    {onToggleSave && (
                        <div className={styles.saveBtnWrap}>
                            <button
                                className={`${styles.saveBtn} ${isSaved ? styles.saveBtnActive : ''}`}
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    onToggleSave(offer.id);
                                }}
                            >
                                {isSaved ? <BookmarkCheck size={15} /> : <Bookmark size={15} />}
                            </button>
                        </div>
                    )}

                    {/* Lock overlay */}
                    {!hasAccess && (
                        <div className={styles.lockOverlay}>
                            <div className={styles.lockContent}>
                                <Lock size={20} />
                                <span>Plano superior</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Body */}
                <div className={styles.body}>
                    <h3 className={styles.title}>{offer.title}</h3>
                    <div className={styles.meta}>
                        <span className={styles.metaItem}>
                            <DollarSign size={12} />
                            <span className={styles.metaValue}>
                                R${offer.ticket.toFixed(2).replace('.', ',')}
                            </span>
                        </span>
                        {offer.referenceCpl && (
                            <span className={styles.metaItem}>
                                CPL{' '}
                                <span className={styles.metaValue}>
                                    R${offer.referenceCpl.toFixed(2).replace('.', ',')}
                                </span>
                            </span>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className={styles.footer}>
                    <div className={styles.planBadges}>
                        {offer.availableOnPlans.map((plan) => (
                            <span
                                key={plan}
                                className={styles.planDot}
                                style={{ background: planColors[plan] || 'var(--text-muted)' }}
                                title={plan}
                            />
                        ))}
                    </div>
                    <div className={styles.statsRow}>
                        <span className={styles.stat}>
                            <Eye size={12} /> {offer.views}
                        </span>
                        <span className={styles.stat}>
                            <Bookmark size={12} /> {offer.saves}
                        </span>
                    </div>
                </div>
            </Link>
        </motion.div>
    );
}
