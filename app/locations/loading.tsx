export default function LocationsLoading() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--color--dark-slate-deepest)'
    }}>
      <div style={{
        textAlign: 'center',
        fontFamily: 'var(--font-family--headings)',
        color: 'white'
      }}>
        <div className="bounce-loader">
          <div className="bounce1"></div>
          <div className="bounce2"></div>
          <div className="bounce3"></div>
        </div>
        <div style={{ fontSize: '18px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: '30px' }}>
          Loading Locations...
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
          background-color: #ad4338;
          animation-delay: -0.32s;
        }

        .bounce-loader .bounce2 {
          background-color: #c0564a;
          animation-delay: -0.16s;
        }

        .bounce-loader .bounce3 {
          background-color: #d3695d;
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
