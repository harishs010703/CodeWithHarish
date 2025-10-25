// src/pages/Home.tsx
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/lobby');
  };

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
      fontFamily: '"JetBrains Mono", "Fira Code", "Cascadia Code", monospace',
      position: 'relative',
      overflow: 'hidden',
      color: '#ffffff'
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
        {'{ code: "together" }'}
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
        git commit -m "collaborate"
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
        function() 
      </div>
      
      {/* Main Content Container */}
      <div style={{
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        padding: '3.5rem 3rem',
        borderRadius: '16px',
        border: '1px solid rgba(56, 189, 248, 0.2)',
        textAlign: 'center',
        maxWidth: '600px',
        width: '90%',
        backdropFilter: 'blur(20px)',
        position: 'relative',
        zIndex: 1,
        boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5), 0 0 100px rgba(56, 189, 248, 0.1)'
      }}>
        {/* Code Snippet Header */}
        <div style={{
          backgroundColor: 'rgba(30, 41, 59, 0.8)',
          padding: '1rem',
          borderRadius: '8px',
          marginBottom: '2rem',
          border: '1px solid rgba(56, 189, 248, 0.3)',
          fontFamily: 'monospace',
          fontSize: '0.9rem',
          textAlign: 'left'
        }}>
          <div style={{ color: '#64748b', marginBottom: '0.5rem' }}>
            // Welcome 
          </div>
          <div style={{ color: '#38bdf8' }}>
            <span style={{ color: '#f59e0b' }}>const</span>{' '}
            <span style={{ color: '#10b981' }}>collaboration</span>{' '}
            = <span style={{ color: '#ec4899' }}>await</span>{' '}
            <span style={{ color: '#38bdf8' }}>startCoding</span>
            <span style={{ color: '#ffffff' }}>({'{'}together: true{'}'});</span>
          </div>
        </div>
        
        <h1 style={{
          fontSize: '3rem',
          fontWeight: '800',
          background: 'linear-gradient(135deg, #38bdf8, #10b981, #f59e0b)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          color: 'transparent',
          marginBottom: '1rem',
          letterSpacing: '-0.02em',
          fontFamily: '"Inter", sans-serif'
        }}>
          Code With Harish
        </h1>
        
        <p style={{
          fontSize: '1.3rem',
          color: '#94a3b8',
          marginBottom: '1rem',
          lineHeight: '1.6',
          fontFamily: '"Inter", sans-serif'
        }}>
          Real-time collaborative coding platform
        </p>

        <p style={{
          fontSize: '1rem',
          color: '#64748b',
          marginBottom: '2.5rem',
          lineHeight: '1.7',
          fontFamily: '"Inter", sans-serif'
        }}>
          Write, debug, and build amazing projects together with your team. 
          Share code in real-time, collaborate seamlessly, and bring your ideas to life.
        </p>

        {/* Feature Pills */}
        <div style={{
          display: 'flex',
          gap: '0.75rem',
          justifyContent: 'center',
          flexWrap: 'wrap',
          marginBottom: '2.5rem'
        }}>
          
        </div>
        
        <button
          onClick={handleGetStarted}
          style={{
            padding: '18px 40px',
            fontSize: '16px',
            fontWeight: '600',
            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 50%, #1e40af 100%)',
            color: '#ffffff',
            border: 'none',
            borderRadius: '12px',
            cursor: 'pointer',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            fontFamily: '"Inter", sans-serif',
            outline: 'none',
            minWidth: '180px',
            letterSpacing: '0.025em',
            position: 'relative',
            overflow: 'hidden',
            textTransform: 'uppercase',
            boxShadow: '0 8px 32px rgba(59, 130, 246, 0.3), 0 4px 16px rgba(29, 78, 216, 0.2)',
            textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px) scale(1.05)';
            e.currentTarget.style.boxShadow = '0 12px 48px rgba(59, 130, 246, 0.4), 0 6px 24px rgba(29, 78, 216, 0.3)';
            e.currentTarget.style.background = 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 50%, #1e3a8a 100%)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0) scale(1)';
            e.currentTarget.style.boxShadow = '0 8px 32px rgba(59, 130, 246, 0.3), 0 4px 16px rgba(29, 78, 216, 0.2)';
            e.currentTarget.style.background = 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 50%, #1e40af 100%)';
          }}
          onMouseDown={(e) => {
            e.currentTarget.style.transform = 'translateY(0) scale(0.98)';
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px) scale(1.05)';
          }}
          onFocus={(e) => {
            e.currentTarget.style.outline = '3px solid rgba(59, 130, 246, 0.5)';
            e.currentTarget.style.outlineOffset = '2px';
          }}
          onBlur={(e) => {
            e.currentTarget.style.outline = 'none';
            e.currentTarget.style.outlineOffset = '0px';
          }}
        >
          🚀 Get Started
        </button>

        {/* Collaboration Stats */}
        <div style={{
          marginTop: '2rem',
          display: 'flex',
          justifyContent: 'space-around',
          padding: '1rem 0',
          borderTop: '1px solid rgba(56, 189, 248, 0.2)'
        }}>
          
        </div>
      </div>

      {/* Code Symbols Floating */}
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
          h1 { font-size: 2.2rem !important; }
          p { font-size: 0.95rem !important; }
          .feature-pills { flex-direction: column !important; }
        }
      `}</style>
    </div>
  );
};

export default Home;