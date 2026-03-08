'use client';

/* eslint-disable @next/next/no-img-element */
import { useEffect, useEffectEvent, useRef, useState } from 'react';
import Link from 'next/link';
import type { PublicCopy, PublicLocale } from '@/lib/public-copy';

interface CharacterSprite {
    id: string;
    label: string;
    imageUrl: string;
    isDefault: boolean;
    sortOrder: number;
}

interface Character {
    id: string;
    name: string;
    sprites: CharacterSprite[];
    defaultSprite: CharacterSprite | null;
}

interface Choice {
    id: string;
    nodeId: string;
    targetNodeId: string | null;
    text: string;
    scoreImpact: number;
}

interface MusicTrack {
    id: string;
    name: string;
    audioUrl: string;
}

interface Node {
    id: string;
    text: string;
    backgroundImageUrl: string | null;
    audioUrl: string | null;
    musicTrackId: string | null;
    musicTrack: MusicTrack | null;
    musicTrackAudioUrl: string | null;
    isStartNode: boolean;
    isEndNode: boolean;
    character: Character | null;
    characterSpriteId: string | null;
    characterSprite: CharacterSprite | null;
    spriteImageUrl: string | null;
    choices: Choice[];
}

interface GamePageClientProps {
    storyId: string;
    locale: PublicLocale;
    copy: PublicCopy['game'];
}

export default function GamePageClient({ storyId, locale, copy }: GamePageClientProps) {
    const [nodes, setNodes] = useState<Node[]>([]);
    const [currentNode, setCurrentNode] = useState<Node | null>(null);
    const [activeMusicTrack, setActiveMusicTrack] = useState<MusicTrack | null>(null);
    const [isBgmMuted, setIsBgmMuted] = useState(false);
    const [score, setScore] = useState(0);
    const [loading, setLoading] = useState(true);
    const [forcedGameOver, setForcedGameOver] = useState(false);
    const [playerName, setPlayerName] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [displayedText, setDisplayedText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const bgmAudioRef = useRef<HTMLAudioElement | null>(null);
    const typeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const beginTyping = useEffectEvent((text: string) => {
        setDisplayedText('');
        setIsTyping(true);
        let index = 0;

        const type = () => {
            if (index < text.length) {
                setDisplayedText(text.slice(0, index + 1));
                index += 1;
                typeTimeoutRef.current = setTimeout(type, 25);
            } else {
                setIsTyping(false);
            }
        };

        type();
    });

    useEffect(() => {
        (async () => {
            const [nodesResponse, storyResponse] = await Promise.all([
                fetch(`/api/nodes?storyId=${storyId}`),
                fetch(`/api/stories/${storyId}`),
            ]);

            if (nodesResponse.ok) {
                const data: Node[] = await nodesResponse.json();
                setNodes(data);
                const startNode = data.find((node) => node.isStartNode) ?? data[0] ?? null;
                if (startNode) {
                    setCurrentNode(startNode);
                }
                setForcedGameOver(false);
                if (storyResponse.ok) {
                    const story = await storyResponse.json();
                    const nextDefaultMusicTrack = story.defaultMusicTrack ?? null;
                    setActiveMusicTrack(startNode?.musicTrack ?? nextDefaultMusicTrack ?? null);
                } else {
                    setActiveMusicTrack(startNode?.musicTrack ?? null);
                }
            }
            setLoading(false);
        })();
    }, [storyId]);

    useEffect(() => {
        if (!currentNode) {
            return;
        }

        typeTimeoutRef.current = setTimeout(() => {
            beginTyping(currentNode.text);
        }, 0);

        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            audioRef.current = null;
        }

        if (currentNode.audioUrl) {
            const audio = new Audio(currentNode.audioUrl);
            audioRef.current = audio;
            audio.play().catch(() => { });
        }

        return () => {
            if (typeTimeoutRef.current) {
                clearTimeout(typeTimeoutRef.current);
            }
        };
    }, [currentNode]);

    useEffect(() => {
        if (bgmAudioRef.current) {
            bgmAudioRef.current.muted = isBgmMuted;
        }
    }, [isBgmMuted]);

    useEffect(() => {
        if (!activeMusicTrack?.audioUrl) {
            if (bgmAudioRef.current) {
                bgmAudioRef.current.pause();
                bgmAudioRef.current = null;
            }
            return;
        }

        if (bgmAudioRef.current?.src === new URL(activeMusicTrack.audioUrl, window.location.origin).toString()) {
            bgmAudioRef.current.muted = isBgmMuted;
            bgmAudioRef.current.play().catch(() => { });
            return;
        }

        if (bgmAudioRef.current) {
            bgmAudioRef.current.pause();
        }

        const bgm = new Audio(activeMusicTrack.audioUrl);
        bgm.loop = true;
        bgm.muted = isBgmMuted;
        bgm.volume = 0.55;
        bgmAudioRef.current = bgm;
        bgm.play().catch(() => { });

        return () => {
            if (bgmAudioRef.current === bgm) {
                bgm.pause();
            }
        };
    }, [activeMusicTrack, isBgmMuted]);

    useEffect(() => {
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
            }
            if (bgmAudioRef.current) {
                bgmAudioRef.current.pause();
            }
        };
    }, []);

    function skipTyping() {
        bgmAudioRef.current?.play().catch(() => { });
        if (isTyping && currentNode) {
            if (typeTimeoutRef.current) {
                clearTimeout(typeTimeoutRef.current);
            }
            setDisplayedText(currentNode.text);
            setIsTyping(false);
        }
    }

    function handleChoice(choice: Choice) {
        bgmAudioRef.current?.play().catch(() => { });
        if (isTyping) {
            return;
        }

        setScore((previous) => previous + choice.scoreImpact);

        if (choice.targetNodeId) {
            const nextNode = nodes.find((node) => node.id === choice.targetNodeId);
            if (nextNode) {
                setForcedGameOver(false);
                if (nextNode.musicTrack) {
                    setActiveMusicTrack((previous) => previous?.id === nextNode.musicTrack?.id ? previous : nextNode.musicTrack);
                }
                setCurrentNode(nextNode);
                return;
            }
        }

        setForcedGameOver(true);
    }

    function toggleBgmMute() {
        setIsBgmMuted((current) => !current);
        bgmAudioRef.current?.play().catch(() => { });
    }

    async function handleSubmitScore() {
        await fetch('/api/leaderboard', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: playerName.trim() || copy.anonymousFallbackName,
                score,
                locale,
            }),
        });
        setSubmitted(true);
    }

    if (loading) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="animate-pulse" style={{ fontSize: '1.5rem', color: 'var(--text-muted)' }}>{copy.loading}</div>
            </div>
        );
    }

    if (!currentNode) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
                <p style={{ fontSize: '2rem' }}>😕</p>
                <p style={{ color: 'var(--text-muted)' }}>{copy.noNodes}</p>
                <Link href="/play" className="btn btn-primary">{copy.backToStories}</Link>
            </div>
        );
    }

    const gameOver = forcedGameOver || currentNode.isEndNode;

    if (gameOver) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '2rem',
                backgroundImage: currentNode.backgroundImageUrl ? `url(${currentNode.backgroundImageUrl})` : undefined,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
            }}>
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0,0,0,0.7)',
                    backdropFilter: 'blur(8px)',
                }} />
                <div className="glass-panel animate-slideUp" style={{
                    padding: '3rem',
                    maxWidth: '500px',
                    width: '100%',
                    textAlign: 'center',
                    position: 'relative',
                    zIndex: 1,
                    border: '1px solid var(--primary)',
                }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏁</div>
                    <h1 className="text-gradient" style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{copy.completeTitle}</h1>

                    {currentNode.text && (
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontStyle: 'italic' }}>
                            &ldquo;{currentNode.text}&rdquo;
                        </p>
                    )}

                    <div style={{
                        padding: '1.5rem',
                        background: 'rgba(0,0,0,0.3)',
                        borderRadius: 'var(--radius-md)',
                        marginBottom: '2rem',
                        border: '1px solid var(--glass-border)',
                    }}>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>{copy.finalScoreLabel}</p>
                        <p style={{
                            fontSize: '3rem',
                            fontWeight: 800,
                            color: score > 0 ? 'var(--success-light)' : score < 0 ? 'var(--danger-light)' : 'var(--text-primary)',
                        }}>
                            {score > 0 ? '+' : ''}{score}
                        </p>
                    </div>

                    {!submitted ? (
                        <div>
                            <input
                                type="text"
                                value={playerName}
                                onChange={(event) => setPlayerName(event.target.value)}
                                placeholder={copy.namePlaceholder}
                                style={{ marginBottom: '1rem', textAlign: 'center' }}
                            />
                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                                <button onClick={handleSubmitScore} className="btn btn-primary" style={{ flex: 1 }}>
                                    {copy.submitScore}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="animate-fadeIn">
                            <p style={{ color: 'var(--success-light)', marginBottom: '1rem', fontWeight: 600 }}>{copy.submitted}</p>
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                        <Link href="/play" className="btn btn-secondary" style={{ flex: 1 }}>{copy.playAnother}</Link>
                        <Link href="/leaderboard" className="btn btn-secondary" style={{ flex: 1 }}>{copy.leaderboard}</Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="vn-play-shell">
            <div style={{
                position: 'fixed',
                inset: 0,
                zIndex: 0,
                backgroundImage: currentNode.backgroundImageUrl ? `url(${currentNode.backgroundImageUrl})` : undefined,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                transition: 'background-image 0.5s ease',
            }}>
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: currentNode.backgroundImageUrl
                        ? 'linear-gradient(to bottom, rgba(0,0,0,0.18) 0%, rgba(0,0,0,0.52) 55%, rgba(10,10,20,0.92) 100%)'
                        : 'linear-gradient(to bottom, var(--bg-darkest), var(--bg-darker))',
                }} />
            </div>

            <div style={{
                position: 'fixed',
                top: '1rem',
                right: '1rem',
                zIndex: 10,
                padding: '0.5rem 1rem',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(0,0,0,0.5)',
                backdropFilter: 'blur(8px)',
                border: '1px solid var(--glass-border)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                flexWrap: 'wrap',
            }}>
                {activeMusicTrack && (
                    <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={toggleBgmMute}
                        style={{ padding: '0.35rem 0.7rem', fontSize: '0.78rem' }}
                    >
                        {isBgmMuted ? copy.bgmUnmute : copy.bgmMute}
                    </button>
                )}
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{copy.scoreLabel}:</span>
                <span style={{ fontWeight: 700, color: score > 0 ? 'var(--success-light)' : score < 0 ? 'var(--danger-light)' : 'var(--text-primary)' }}>
                    {score > 0 ? '+' : ''}{score}
                </span>
            </div>

            <Link href="/play" style={{
                position: 'fixed',
                top: '1rem',
                left: '1rem',
                zIndex: 10,
                padding: '0.5rem 1rem',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(0,0,0,0.5)',
                backdropFilter: 'blur(8px)',
                border: '1px solid var(--glass-border)',
                fontSize: '0.85rem',
                color: 'var(--text-muted)',
            }}>
                {copy.exit}
            </Link>

            <section className="vn-stage-shell">
                <div className="vn-stage">
                    {currentNode.spriteImageUrl && (
                        <div key={`${currentNode.id}:${currentNode.spriteImageUrl}`} className="vn-stage-figure animate-fadeIn">
                            <img
                                src={currentNode.spriteImageUrl}
                                alt={currentNode.character ? `${currentNode.character.name} - ${currentNode.characterSprite?.label ?? copy.spriteAltFallback}` : copy.spriteAltFallback}
                                className="vn-stage-sprite"
                            />
                        </div>
                    )}
                </div>
            </section>

            <div className="vn-dialogue-shell">
                <div className="vn-dialogue-box" onClick={skipTyping}>
                    {currentNode.character && (
                        <div className="vn-speaker-name">{currentNode.character.name}</div>
                    )}

                    <p style={{ fontSize: '1.1rem', lineHeight: 1.7, minHeight: '3rem', color: 'var(--text-primary)' }}>
                        {displayedText}
                        {isTyping && <span style={{ animation: 'pulse 0.5s ease infinite' }}>▌</span>}
                    </p>

                    {isTyping && (
                        <p style={{ textAlign: 'right', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                            {copy.tapToSkip}
                        </p>
                    )}

                    {!isTyping && currentNode.choices.length > 0 && (
                        <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {currentNode.choices.map((choice, index) => (
                                <button
                                    key={choice.id}
                                    onClick={() => handleChoice(choice)}
                                    className="vn-choice-btn"
                                    style={{
                                        opacity: 0,
                                        animation: `fadeIn 0.3s ease forwards ${index * 0.1}s`,
                                    }}
                                >
                                    {choice.text}
                                    {choice.scoreImpact !== 0 && (
                                        <span style={{
                                            float: 'right',
                                            fontSize: '0.85rem',
                                            color: choice.scoreImpact > 0 ? 'var(--success-light)' : 'var(--danger-light)',
                                            opacity: 0.6,
                                        }}>
                                            {choice.scoreImpact > 0 ? '+' : ''}{choice.scoreImpact}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
