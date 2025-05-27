import React, { useState, useEffect } from 'react';

const Mail = () => {
    const userEmail = localStorage.getItem('userEmail') || 'gunavardhan240@gmail.com';

    const [to, setTo] = useState('');
    const [content, setContent] = useState('');
    const [status, setStatus] = useState('');
    const [receivedMails, setReceivedMails] = useState([]);
    const [openedMailIndex, setOpenedMailIndex] = useState(null);

    // Fetch received mails
    useEffect(() => {
        const fetchMails = async () => {
            try {
                const response = await fetch('http://localhost:8000/mails');
                if (response.ok) {
                    const data = await response.json();
                    setReceivedMails(data);
                } else {
                    console.error('Failed to fetch mails.');
                }
            } catch (error) {
                console.error('Error fetching mails:', error);
            }
        };
        fetchMails();
    }, []);

    const handleSend = async () => {
        setStatus('Sending...');
        try {
            const response = await fetch('http://localhost:8000/api/send-mail', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ from: userEmail, to, content }),
            });
            if (response.ok) {
                setStatus('Mail sent successfully!');
                setTo('');
                setContent('');
            } else {
                setStatus('Failed to send mail.');
            }
        } catch (error) {
            setStatus('Error sending mail.');
        }
    };

    return (
        <div style={{ display: 'flex', gap: '20px', padding: 20 }}>
            {/* Received Mails */}
            <div style={{ flex: 1, borderRight: '1px solid #ccc', paddingRight: 20 }}>
                <h3>Inbox for {userEmail}</h3>
                {receivedMails.length === 0 ? (
                    <p>No emails received.</p>
                ) : (
                    <ul style={{ listStyle: 'none', padding: 0 }}>
                        {receivedMails.map((mail, index) => (
                            <li
                                key={index}
                                style={{
                                    borderBottom: '1px solid #eee',
                                    padding: '10px 0',
                                    cursor: 'pointer',
                                    background: openedMailIndex === index ? '#f5f5f5' : 'transparent'
                                }}
                                onClick={() => setOpenedMailIndex(openedMailIndex === index ? null : index)}
                            >
                                <strong>From:</strong> {mail.from}<br />
                                <strong>Subject:</strong> {mail.subject}<br />
                                {openedMailIndex === index && (
                                    <>
                                        <strong>Content:</strong>
                                        <div style={{ whiteSpace: 'pre-wrap', maxHeight: 200, overflow: 'auto' }}>
                                            {mail.body}
                                        </div>
                                    </>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* Send Mail */}
            <div style={{ flex: 1 }}>
                <h3>Send Mail</h3>
                <div>
                    <label>From:</label>
                    <input
                        type="email"
                        value={userEmail}
                        disabled
                        style={{ width: '100%', marginBottom: 10, background: '#eee' }}
                    />
                </div>
                <div>
                    <label>To:</label>
                    <input
                        type="email"
                        value={to}
                        onChange={e => setTo(e.target.value)}
                        style={{ width: '100%', marginBottom: 10 }}
                    />
                </div>
                <div>
                    <label>Content:</label>
                    <textarea
                        value={content}
                        onChange={e => setContent(e.target.value)}
                        rows={6}
                        style={{ width: '100%', marginBottom: 10 }}
                    />
                </div>
                <button onClick={handleSend}>Send</button>
                {status && <div style={{ marginTop: 10 }}>{status}</div>}
            </div>
        </div>
    );
};

export default Mail;