'use client';
/* eslint-disable @next/next/no-img-element */
import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface Character {
    id: string;
    name: string;
    spriteImageUrl: string | null;
}

interface Choice {
    id: string;
    nodeId: string;
    targetNodeId: string | null;
    text: string;
    scoreImpact: number;
}

interface Node {
    id: string;
    text: string;
    backgroundImageUrl: string | null;
    audioUrl: string | null;
    isStartNode: boolean;
    isEndNode: boolean;
    character: Character | null;
    choices: Choice[];
}

export default function GamePage() {
    const params = useParams();
    const storyId = params.storyId as string;

    const [nodes, setNodes] = useState<Node[]>([]);
    const [currentNode, setCurrentNode] = useState<Node | null>(null);
    const [score, setScore] = useState(0);
    const [loading, setLoading] = useState(true);
    const [gameOver, setGameOver] = useState(false);
    const [playerName, setPlayerName] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [displayedText, setDisplayedText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const typeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        (async () => {
            const res = await fetch(`/api/nodes?storyId=${storyId}`);
            if (res.ok) {
                const data: Node[] = await res.json();
                setNodes(data);
                const startNode = data.find(n => n.isStartNode);
                if (startNode) setCurrentNode(startNode);
                else if (data.length > 0) setCurrentNode(data[0]);
            }
            setLoading(false);
        })();
    }, [storyId]);

    // Typewriter effect
    const startTyping = useCallback((text: string) => {
        setDisplayedText('');
        setIsTyping(true);
        let index = 0;

        const type = () => {
            if (index < text.length) {
                setDisplayedText(text.slice(0, index + 1));
                index++;
                typeTimeoutRef.current = setTimeout(type, 25);
            } else {
                setIsTyping(false);
            }
        };
        type();
    }, []);

    useEffect(() => {
        if (currentNode) {
            startTyping(currentNode.text);

            // Play audio
            if (currentNode.audioUrl) {
                if (audioRef.current) {
                    audioRef.current.pause();
                }
                const audio = new Audio(currentNode.audioUrl);
                audioRef.current = audio;
                audio.play().catch(() => { });
            }

            if (currentNode.isEndNode) {
                setGameOver(true);
            }
        }
        return () => {
            if (typeTimeoutRef.current) clearTimeout(typeTimeoutRef.current);
        };
    }, [currentNode, startTyping]);

    const skipTyping = () => {
        if (isTyping && currentNode) {
            if (typeTimeoutRef.current) clearTimeout(typeTimeoutRef.current);
            setDisplayedText(currentNode.text);
            setIsTyping(false);
        }
    };

    const handleChoice = (choice: Choice) => {
        if (isTyping) return;
        setScore(prev => prev + choice.scoreImpact);

        if (choice.targetNodeId) {
            const nextNode = nodes.find(n => n.id === choice.targetNodeId);
            if (nextNode) setCurrentNode(nextNode);
            else setGameOver(true);
        } else {
            setGameOver(true);
        }
    };

    const handleSubmitScore = async () => {
        await fetch('/api/leaderboard', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: playerName || 'Anonymous Voter', score }),
        });
        setSubmitted(true);
    };

    if (loading) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="animate-pulse" style={{ fontSize: '1.5rem', color: 'var(--text-muted)' }}>Loading story...</div>
            </div>
        );
    }

    if (!currentNode) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
                <p style={{ fontSize: '2rem' }}>😕</p>
                <p style={{ color: 'var(--text-muted)' }}>This story has no nodes yet.</p>
                <Link href="/play" className="btn btn-primary">← Back to Stories</Link>
            </div>
        );
    }

    // Game Over / End Screen
    if (gameOver) {
        return (
            <div style={{
                minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '2rem',
                backgroundImage: currentNode.backgroundImageUrl ? `url(${currentNode.backgroundImageUrl})` : undefined,
                backgroundSize: 'cover', backgroundPosition: 'center',
            }}>
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
                }} />
                <div className="glass-panel animate-slideUp" style={{
                    padding: '3rem', maxWidth: '500px', width: '100%', textAlign: 'center',
                    position: 'relative', zIndex: 1, border: '1px solid var(--primary)',
                }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏁</div>
                    <h1 className="text-gradient" style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Story Complete!</h1>

                    {currentNode.text && (
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontStyle: 'italic' }}>
                            &ldquo;{currentNode.text}&rdquo;
                        </p>
                    )}

                    <div style={{
                        padding: '1.5rem', background: 'rgba(0,0,0,0.3)', borderRadius: 'var(--radius-md)',
                        marginBottom: '2rem', border: '1px solid var(--glass-border)',
                    }}>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Your Political Score</p>
                        <p style={{
                            fontSize: '3rem', fontWeight: 800,
                            color: score > 0 ? 'var(--success-light)' : score < 0 ? 'var(--danger-light)' : 'var(--text-primary)',
                        }}>
                            {score > 0 ? '+' : ''}{score}
                        </p>
                    </div>

                    {!submitted ? (
                        <div>
                            <input
                                type="text" value={playerName} onChange={e => setPlayerName(e.target.value)}
                                placeholder="Enter your name..."
                                style={{ marginBottom: '1rem', textAlign: 'center' }}
                            />
                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                                <button onClick={handleSubmitScore} className="btn btn-primary" style={{ flex: 1 }}>
                                    Submit to Leaderboard
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="animate-fadeIn">
                            <p style={{ color: 'var(--success-light)', marginBottom: '1rem', fontWeight: 600 }}>✅ Score submitted!</p>
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                        <Link href="/play" className="btn btn-secondary" style={{ flex: 1 }}>Play Another</Link>
                        <Link href="/leaderboard" className="btn btn-secondary" style={{ flex: 1 }}>Leaderboard</Link>
                    </div>
                </div>
            </div>
        );
    }

    // Main Game UI
    return (
        <div style={{
            minHeight: '100vh', display: 'flex', flexDirection: 'column',
            position: 'relative', overflow: 'hidden',
        }}>
            {/* Background */}
            <div style={{
                position: 'fixed', inset: 0, zIndex: 0,
                backgroundImage: currentNode.backgroundImageUrl ? `url(${currentNode.backgroundImageUrl})` : undefined,
                backgroundSize: 'cover', backgroundPosition: 'center',
                transition: 'background-image 0.5s ease',
            }}>
                <div style={{
                    position: 'absolute', inset: 0,
                    background: currentNode.backgroundImageUrl
                        ? 'linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.6) 70%, rgba(10,10,20,0.95) 100%)'
                        : 'linear-gradient(to bottom, var(--bg-darkest), var(--bg-darker))',
                }} />
            </div>

            {/* Score indicator */}
            <div style={{
                position: 'fixed', top: '1rem', right: '1rem', zIndex: 10,
                padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)',
                background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)',
                border: '1px solid var(--glass-border)',
                display: 'flex', alignItems: 'center', gap: '0.5rem',
            }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Score:</span>
                <span style={{ fontWeight: 700, color: score > 0 ? 'var(--success-light)' : score < 0 ? 'var(--danger-light)' : 'var(--text-primary)' }}>
                    {score > 0 ? '+' : ''}{score}
                </span>
            </div>

            {/* Back link */}
            <Link href="/play" style={{
                position: 'fixed', top: '1rem', left: '1rem', zIndex: 10,
                padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)',
                background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)',
                border: '1px solid var(--glass-border)', fontSize: '0.85rem', color: 'var(--text-muted)',
            }}>
                ← Exit
            </Link>

            {/* Character sprite */}
            {currentNode.character?.spriteImageUrl && (
                <div className="animate-fadeIn" style={{
                    position: 'fixed', bottom: '280px', left: '50%', transform: 'translateX(-50%)',
                    zIndex: 2, maxHeight: '50vh',
                }}>
                    <img
                        src={currentNode.character.spriteImageUrl}
                        alt={currentNode.character.name}
                        style={{ maxHeight: '50vh', objectFit: 'contain', filter: 'drop-shadow(0 4px 20px rgba(0,0,0,0.5))' }}
                    />
                </div>
            )}

            {/* Spacer to push dialogue to bottom */}
            <div style={{ flex: 1 }} />

            {/* Dialogue box */}
            <div className="vn-dialogue-box" style={{ position: 'relative', zIndex: 5 }} onClick={skipTyping}>
                {/* Speaker name */}
                {currentNode.character && (
                    <div className="vn-speaker-name">{currentNode.character.name}</div>
                )}

                {/* Dialogue text */}
                <p style={{ fontSize: '1.1rem', lineHeight: 1.7, minHeight: '3rem', color: 'var(--text-primary)' }}>
                    {displayedText}
                    {isTyping && <span style={{ animation: 'pulse 0.5s ease infinite' }}>▌</span>}
                </p>

                {/* Click to skip indicator */}
                {isTyping && (
                    <p style={{ textAlign: 'right', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                        Click to skip ▶
                    </p>
                )}

                {/* Choices */}
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
    );
}
