'use client';

import { useEffect, useState } from 'react';

type PublicLocale = 'id' | 'en';

export default function PublicLanguageControl() {
    const [locale, setLocale] = useState<PublicLocale>('id');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        let cancelled = false;

        async function loadSettings() {
            try {
                const response = await fetch('/api/site-settings', { cache: 'no-store' });
                if (!response.ok) {
                    throw new Error('Failed to load settings');
                }

                const data = await response.json() as { publicLocale: PublicLocale };
                if (!cancelled) {
                    setLocale(data.publicLocale);
                }
            } catch {
                if (!cancelled) {
                    setMessage('Unable to load the public site language.');
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        void loadSettings();

        return () => {
            cancelled = true;
        };
    }, []);

    async function handleChange(nextLocale: PublicLocale) {
        setLocale(nextLocale);
        setSaving(true);
        setMessage('');

        try {
            const response = await fetch('/api/site-settings', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ publicLocale: nextLocale }),
            });

            if (!response.ok) {
                throw new Error('Failed to save settings');
            }

            setMessage(`Public site language set to ${nextLocale === 'id' ? 'Bahasa Indonesia' : 'English'}.`);
        } catch {
            setMessage('Unable to save the public site language.');
        } finally {
            setSaving(false);
        }
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', minWidth: '230px' }}>
            <label htmlFor="public-language-select" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Public Site Language
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <select
                    id="public-language-select"
                    value={locale}
                    onChange={(event) => void handleChange(event.target.value as PublicLocale)}
                    disabled={loading || saving}
                    style={{ minWidth: '170px' }}
                >
                    <option value="id">Bahasa Indonesia</option>
                    <option value="en">English</option>
                </select>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {saving ? 'Saving...' : loading ? 'Loading...' : locale.toUpperCase()}
                </span>
            </div>
            {message && (
                <span style={{ fontSize: '0.75rem', color: message.startsWith('Unable') ? 'var(--danger-light)' : 'var(--success-light)' }}>
                    {message}
                </span>
            )}
        </div>
    );
}
