import React from 'react';

/**
 * TestimonialCard — Neo-Brutalist testimonial card.
 * 100% inline styles. Accepts a `size` config object for responsive scaling.
 *
 * Props: name, role, company, avatar, review, size
 * size = { cardWidth, padding, quoteSize, reviewSize, nameSize, roleSize, avatarSize, gap }
 */

const DEFAULT_SIZE = {
    cardWidth: 300,
    padding: 20,
    quoteSize: 40,
    reviewSize: 12,
    nameSize: 13,
    roleSize: 10,
    avatarSize: 36,
    gap: 12,
};

export default function TestimonialCard({ name, role, company, avatar, review, size = DEFAULT_SIZE }) {
    const s = { ...DEFAULT_SIZE, ...size };

    const initials = name
        ? name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
        : '?';

    return (
        <div
            aria-label={`Testimonial from ${name}`}
            style={{
                flexShrink: 0,
                width: `${s.cardWidth}px`,
                backgroundColor: '#FFFFFF',
                border: '3px solid #060608',
                padding: `${s.padding}px`,
                display: 'flex',
                flexDirection: 'column',
                gap: `${s.gap}px`,
                userSelect: 'none',
                boxShadow: '4px 4px 0px 0px #060608',
                boxSizing: 'border-box',
            }}
        >
            {/* Quote mark */}
            <span
                aria-hidden="true"
                style={{
                    fontWeight: 900,
                    fontSize: `${s.quoteSize}px`,
                    lineHeight: 1,
                    color: '#FF6B00',
                    userSelect: 'none',
                }}
            >
                "
            </span>

            {/* Review text */}
            <p
                style={{
                    fontFamily: "'Space Mono', monospace",
                    fontSize: `${s.reviewSize}px`,
                    lineHeight: 1.6,
                    color: '#060608',
                    flex: 1,
                    display: '-webkit-box',
                    WebkitLineClamp: 5,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    margin: 0,
                }}
            >
                {review}
            </p>

            {/* Divider */}
            <div
                style={{
                    height: '2px',
                    width: '100%',
                    backgroundColor: '#060608',
                    opacity: 0.1,
                }}
            />

            {/* Author row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '2px' }}>
                {/* Avatar */}
                {avatar ? (
                    <img
                        src={avatar}
                        alt={name}
                        loading="lazy"
                        style={{
                            width: `${s.avatarSize}px`,
                            height: `${s.avatarSize}px`,
                            borderRadius: '50%',
                            border: '2px solid #060608',
                            objectFit: 'cover',
                            flexShrink: 0,
                        }}
                    />
                ) : (
                    <div
                        style={{
                            width: `${s.avatarSize}px`,
                            height: `${s.avatarSize}px`,
                            borderRadius: '50%',
                            border: '2px solid #060608',
                            backgroundColor: '#FF6B00',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                        }}
                    >
                        <span
                            style={{
                                fontWeight: 900,
                                fontSize: `${Math.max(s.roleSize, 9)}px`,
                                color: '#FFFFFF',
                            }}
                        >
                            {initials}
                        </span>
                    </div>
                )}

                {/* Meta */}
                <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                    <span
                        style={{
                            fontWeight: 900,
                            fontSize: `${s.nameSize}px`,
                            color: '#060608',
                            lineHeight: 1.2,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                        }}
                    >
                        {name}
                    </span>
                    {(role || company) && (
                        <span
                            style={{
                                fontFamily: "'Space Mono', monospace",
                                fontSize: `${s.roleSize}px`,
                                color: '#060608',
                                opacity: 0.6,
                                lineHeight: 1.2,
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                            }}
                        >
                            {[role, company].filter(Boolean).join(' · ')}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}
