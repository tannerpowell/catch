export default function MenuLoading() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--color--crema-fresca)'
    }}>
      <div style={{
        textAlign: 'center',
        fontFamily: 'var(--font-family--headings)',
        color: 'var(--color--tierra-reca)'
      }}>
        <div className="bounce-loader">
          <div className="bounce1"></div>
          <div className="bounce2"></div>
          <div className="bounce3"></div>
        </div>
        <div style={{ fontSize: '18px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: '30px' }}>
          Loading Menu...
        </div>
      </div>
      <style>{`
        .bounce-loader {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 8px;
        }

        .bounce-loader > div {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          animation: bouncedelay 1.4s infinite ease-in-out both;
        }

        .bounce-loader .bounce1 {
          background-color: #2B7A9B;
          animation-delay: -0.32s;
        }

        .bounce-loader .bounce2 {
          background-color: #3d8fb3;
          animation-delay: -0.16s;
        }

        .bounce-loader .bounce3 {
          background-color: #5aa4c4;
        }

        @keyframes bouncedelay {
          0%, 80%, 100% {
            transform: scale(0);
            opacity: 0.5;
          }
          40% {
            transform: scale(1.0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
