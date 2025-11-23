import Link from 'next/link';
import Image from 'next/image';

export default function NotFound() {
  return (
    <div style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden' }}>
      {/* Background Image */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        <Image
          src="/images/events-2000px.jpg"
          alt="Sunset over water"
          fill
          style={{ objectFit: 'cover', objectPosition: 'center' }}
          priority
        />
        {/* Subtle overlay for text readability */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(135deg, rgba(15, 23, 32, 0.3) 0%, rgba(50, 39, 35, 0.2) 100%)',
        }} />
      </div>

      {/* Content */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px',
      }}>
        <div style={{
          maxWidth: '600px',
          textAlign: 'center',
          background: 'rgba(253, 248, 237, 0.95)',
          backdropFilter: 'blur(10px)',
          borderRadius: '16px',
          padding: '48px 40px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        }}>
          <h1 style={{
            fontFamily: 'var(--font-family--headings)',
            fontSize: '120px',
            color: 'var(--color--chile-rojo)',
            marginBottom: '8px',
            lineHeight: '1',
            fontWeight: '700',
          }}>
            404
          </h1>
          <h2 style={{
            fontFamily: 'var(--font-family--headings)',
            fontSize: '36px',
            color: 'var(--color--tierra-reca)',
            marginBottom: '16px',
            fontWeight: '600',
          }}>
            Lost at Sea
          </h2>
          <p style={{
            fontSize: '18px',
            color: 'rgba(50, 39, 35, 0.75)',
            marginBottom: '32px',
            lineHeight: '1.6',
          }}>
            The page you're looking for has drifted away. Let's get you back on course.
          </p>
          <div style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <Link
              href="/"
              style={{
                padding: '14px 32px',
                backgroundColor: 'var(--color--chile-rojo)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                textDecoration: 'none',
                display: 'inline-block',
                transition: 'all 0.3s',
                boxShadow: '0 4px 12px rgba(43, 122, 155, 0.25)',
              }}
            >
              Go home
            </Link>
            <Link
              href="/menu"
              style={{
                padding: '14px 32px',
                backgroundColor: 'white',
                color: 'var(--color--tierra-reca)',
                border: '1.5px solid var(--color--tierra-reca)',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                textDecoration: 'none',
                display: 'inline-block',
                transition: 'all 0.3s',
              }}
            >
              View menu
            </Link>
            <Link
              href="/locations"
              style={{
                padding: '14px 32px',
                backgroundColor: 'white',
                color: 'var(--color--tierra-reca)',
                border: '1.5px solid var(--color--tierra-reca)',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                textDecoration: 'none',
                display: 'inline-block',
                transition: 'all 0.3s',
              }}
            >
              Find a location
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
