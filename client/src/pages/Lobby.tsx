import React, { useState } from 'react';
import { generateSessionId } from '../utils/generateSessionId';
import { useNavigate } from 'react-router-dom';

const Lobby = () => {
  // Create Session State
  const [creatorName, setCreatorName] = useState('');
  const [generatedSessionId, setGeneratedSessionId] = useState('');
  const [copiedCreate, setCopiedCreate] = useState(false);

  // Join Session State
  const [joinerName, setJoinerName] = useState('');
  const [joinSessionId, setJoinSessionId] = useState('');
  const [copiedJoin, setCopiedJoin] = useState(false);
const navigate = useNavigate();


  const handleGenerateSessionId = () => {
    const newId = generateSessionId();
    setGeneratedSessionId(newId);
    setCopiedCreate(false);
  };

  const handleCopy = (value: string, target: 'create' | 'join') => {
    navigator.clipboard.writeText(value);
    if (target === 'create') {
      setCopiedCreate(true);
      setTimeout(() => setCopiedCreate(false), 1500);
    } else {
      setCopiedJoin(true);
      setTimeout(() => setCopiedJoin(false), 1500);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
      fontFamily: '"Inter", sans-serif',
      position: 'relative',
      overflow: 'hidden',
      color: '#ffffff',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '2rem'
    }}>
      {/* Animated Code Grid Background */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: `
          linear-gradient(90deg, rgba(56, 189, 248, 0.05) 1px, transparent 1px),
          linear-gradient(rgba(56, 189, 248, 0.05) 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px',
        animation: 'gridMove 20s linear infinite',
        pointerEvents: 'none'
      }} />

      {/* Floating Code Elements */}
      <div style={{
        position: 'absolute',
        top: '10%',
        left: '10%',
        fontSize: '14px',
        color: '#38bdf8',
        fontFamily: 'monospace',
        opacity: '0.3',
        animation: 'float 8s ease-in-out infinite',
        pointerEvents: 'none'
      }}>
        {'{ session: "active" }'}
      </div>
      
      <div style={{
        position: 'absolute',
        bottom: '15%',
        right: '15%',
        fontSize: '12px',
        color: '#10b981',
        fontFamily: 'monospace',
        opacity: '0.3',
        animation: 'float 6s ease-in-out infinite reverse',
        pointerEvents: 'none'
      }}>
        git branch -b collaborate
      </div>

      <div style={{
        position: 'absolute',
        top: '25%',
        right: '8%',
        fontSize: '16px',
        color: '#f59e0b',
        fontFamily: 'monospace',
        opacity: '0.25',
        animation: 'float 10s ease-in-out infinite',
        pointerEvents: 'none'
      }}>
        connect()
      </div>

      {/* Page Title */}
      <div style={{
        textAlign: 'center',
        marginBottom: '3rem',
        zIndex: 1,
        position: 'relative'
      }}>
        <h1 style={{
          fontSize: '2.5rem',
          fontWeight: '800',
          background: 'linear-gradient(135deg, #38bdf8, #10b981, #f59e0b)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          color: 'transparent',
          marginBottom: '0.5rem',
          letterSpacing: '-0.02em'
        }}>
          Join the Collaboration
        </h1>
        <p style={{
          fontSize: '1.1rem',
          color: '#94a3b8',
          marginBottom: '0'
        }}>
          Create a new session or join an existing one
        </p>
      </div>

      {/* Cards Container */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        gap: '2rem', 
        width: '100%',
        maxWidth: '900px',
        zIndex: 1,
        position: 'relative'
      }}>
        {/* Create Session Card */}
        <div style={{
          backgroundColor: 'rgba(15, 23, 42, 0.9)',
          padding: '2.5rem',
          borderRadius: '16px',
          border: '1px solid rgba(56, 189, 248, 0.2)',
          width: '400px',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5), 0 0 100px rgba(56, 189, 248, 0.1)'
        }}>
          {/* Code Header */}
         

          <h2 style={{ 
            color: '#fff', 
            marginBottom: '1rem',
            fontSize: '1.5rem',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            🔷 Create Session
          </h2>
          <p style={{ 
            color: '#94a3b8',
            marginBottom: '1.5rem',
            lineHeight: '1.6'
          }}>
            Start a new collaborative coding environment
          </p>

          <label style={{ 
            color: '#cbd5e1',
            fontSize: '0.9rem',
            fontWeight: '500',
            display: 'block',
            marginBottom: '0.5rem'
          }}>
            Your Name
          </label>
          <input
            type="text"
            placeholder="Enter your name"
            value={creatorName}
            onChange={(e) => setCreatorName(e.target.value)}
            style={inputStyle}
          />

          <label style={{ 
            color: '#cbd5e1',
            fontSize: '0.9rem',
            fontWeight: '500',
            display: 'block',
            marginBottom: '0.5rem'
          }}>
            Session ID
          </label>
          <div style={inputRowStyle}>
            <input
              type="text"
              placeholder="Generate or enter session ID"
              value={generatedSessionId}
              readOnly
              style={inputStyle}
            />
            <button onClick={() => handleCopy(generatedSessionId, 'create')} style={copyButtonStyle}>
              {copiedCreate ? '✅' : '📋'}
            </button>
          </div>

          <button onClick={handleGenerateSessionId} style={blueButtonStyle}>
            Generate Session ID →
          </button>
          <button
            style={pinkButtonStyle}
            onClick={() => {
              if (!creatorName || !generatedSessionId) {
                alert('Please enter your name and generate a session ID');
                return;
              }
              navigate(`/room/${generatedSessionId}/${encodeURIComponent(creatorName)}`);
            }}
          >
            🚀 Create New Session →
          </button>
        </div>

        {/* Join Session Card */}
        <div style={{
          backgroundColor: 'rgba(15, 23, 42, 0.9)',
          padding: '2.5rem',
          borderRadius: '16px',
          border: '1px solid rgba(56, 189, 248, 0.2)',
          width: '400px',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5), 0 0 100px rgba(56, 189, 248, 0.1)'
        }}>
          {/* Code Header */}
          

          <h2 style={{ 
            color: '#fff', 
            marginBottom: '1rem',
            fontSize: '1.5rem',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            👤 Join Session
          </h2>
          <p style={{ 
            color: '#94a3b8',
            marginBottom: '1.5rem',
            lineHeight: '1.6'
          }}>
            Enter an existing session with an ID
          </p>

          <label style={{ 
            color: '#cbd5e1',
            fontSize: '0.9rem',
            fontWeight: '500',
            display: 'block',
            marginBottom: '0.5rem'
          }}>
            Your Name
          </label>
          <input
            type="text"
            placeholder="Enter your name"
            value={joinerName}
            onChange={(e) => setJoinerName(e.target.value)}
            style={inputStyle}
          />

          <label style={{ 
            color: '#cbd5e1',
            fontSize: '0.9rem',
            fontWeight: '500',
            display: 'block',
            marginBottom: '0.5rem'
          }}>
            Session ID
          </label>
          <div style={inputRowStyle}>
            <input
              type="text"
              placeholder="e.g. abc-123-xyz"
              value={joinSessionId}
              onChange={(e) => setJoinSessionId(e.target.value)}
              style={inputStyle}
            />
          </div>

          <button style={pinkButtonStyle}
            onClick={() => {
              if (!joinerName || !joinSessionId) {
                alert('Please enter both your name and a session ID to join.');
                return;
              }
              navigate(`/room/${joinSessionId}/${encodeURIComponent(joinerName)}`);
            }}
          >
            🤝 Join Session →
          </button>
        </div>
      </div>

      {/* Floating Code Symbols */}
      <div style={{
        position: 'absolute',
        top: '12%',
        left: '5%',
        fontSize: '2rem',
        color: '#38bdf8',
        opacity: '0.1',
        animation: 'float 7s ease-in-out infinite',
        pointerEvents: 'none',
        fontFamily: 'monospace'
      }}>
        {'</>'}
      </div>

      <div style={{
        position: 'absolute',
        bottom: '25%',
        left: '8%',
        fontSize: '1.5rem',
        color: '#10b981',
        opacity: '0.1',
        animation: 'float 9s ease-in-out infinite reverse',
        pointerEvents: 'none',
        fontFamily: 'monospace'
      }}>
        {'{}'}
      </div>

      <div style={{
        position: 'absolute',
        top: '60%',
        right: '5%',
        fontSize: '1.8rem',
        color: '#f59e0b',
        opacity: '0.1',
        animation: 'float 5s ease-in-out infinite',
        pointerEvents: 'none',
        fontFamily: 'monospace'
      }}>
        &#91;&#93;
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { 
            transform: translateY(0px) rotate(0deg); 
            opacity: 0.1; 
          }
          50% { 
            transform: translateY(-25px) rotate(5deg); 
            opacity: 0.2; 
          }
        }
        
        @keyframes gridMove {
          0% { transform: translate(0, 0); }
          100% { transform: translate(40px, 40px); }
        }
        
        @media (max-width: 768px) {
          .lobby-cards { flex-direction: column !important; }
          .lobby-card { width: 100% !important; max-width: 400px !important; }
        }
      `}</style>
    </div>
  );
};

// Shared Styles - Updated to match Home page design
const inputStyle: React.CSSProperties = {
  width: '100%',
  marginTop: '0.5rem',
  marginBottom: '1rem',
  padding: '0.75rem',
  borderRadius: '8px',
  border: '1px solid rgba(56, 189, 248, 0.2)',
  background: 'rgba(30, 41, 59, 0.8)',
  color: '#fff',
  fontSize: '0.95rem',
  transition: 'all 0.2s ease',
  outline: 'none',
  fontFamily: '"Inter", sans-serif'
};

const inputRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  marginBottom: '1rem',
};

const copyButtonStyle: React.CSSProperties = {
  background: 'rgba(71, 85, 105, 0.8)',
  padding: '0.75rem',
  borderRadius: '8px',
  border: '1px solid rgba(56, 189, 248, 0.2)',
  cursor: 'pointer',
  color: '#fff',
  minWidth: '50px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 0.2s ease',
  fontSize: '1rem'
};

const blueButtonStyle: React.CSSProperties = {
  marginTop: '0.5rem',
  padding: '0.75rem 1rem',
  width: '100%',
  background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 50%, #1e40af 100%)',
  color: '#fff',
  fontWeight: '600',
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer',
  fontSize: '0.95rem',
  transition: 'all 0.2s ease',
  fontFamily: '"Inter", sans-serif',
  boxShadow: '0 4px 16px rgba(59, 130, 246, 0.2)'
};

const pinkButtonStyle: React.CSSProperties = {
  marginTop: '0.75rem',
  padding: '0.6rem 1rem',
  width: '100%',
  background: 'linear-gradient(135deg, #ec4899 0%, #be185d 50%, #9d174d 100%)',
  color: '#fff',
  fontWeight: '600',
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer',
  fontSize: '0.9rem',
  transition: 'all 0.2s ease',
  fontFamily: '"Inter", sans-serif',
  boxShadow: '0 4px 16px rgba(236, 72, 153, 0.2)'
};

export default Lobby;