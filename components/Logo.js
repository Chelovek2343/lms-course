export default function Logo({ height = 32, maxWidth = 170 }) {
    return (
        <div
            style={{
                height,
                maxWidth,
                display: 'flex',
                alignItems: 'center',
                overflow: 'hidden',
                flexShrink: 0,
            }}
        >
            <img
                src="/logo.png"
                alt="BAT Consulting"
                style={{
                    height: '100%',
                    width: 'auto',
                    maxWidth: '100%',
                    objectFit: 'contain',
                    display: 'block',
                }}
                onError={(e) => {
                    e.currentTarget.style.display = 'none';
                }}
            />
        </div>
    );
}