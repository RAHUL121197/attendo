import { useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { getInstallLink } from '../utils/whatsapp';

export default function InstallPage() {
  const [params] = useSearchParams();
  const { employees } = useApp();
  const empId = params.get('employee');
  const fallbackName = params.get('name') || 'there';
  const emp = employees.find((e) => e.id === empId);
  const rawName = emp?.name || fallbackName;
  const name = rawName.charAt(0).toUpperCase() + rawName.slice(1);
  const origin = window.location.origin;
  const installLink = emp
    ? getInstallLink(emp, origin)
    : `${origin}/install?employee=${encodeURIComponent(empId || '')}&name=${encodeURIComponent(rawName)}`;
  const qrData = encodeURIComponent(installLink);

  return (
    <div className="install-page">
      <div className="install-card">
        <div className="install-brand">
          <span className="install-logo">
            <svg viewBox="0 0 60 60" width="48" height="48">
              <defs>
                <linearGradient id="installGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style={{ stopColor: '#0f766e' }} />
                  <stop offset="100%" style={{ stopColor: '#0e7490' }} />
                </linearGradient>
              </defs>
              <rect width="60" height="60" rx="16" fill="url(#installGrad)" />
              <text x="30" y="27" fontFamily="Arial,sans-serif" fontSize="24" fontWeight="bold" fill="white" textAnchor="middle">A</text>
              <text x="30" y="43" fontFamily="Arial,sans-serif" fontSize="9" fill="rgba(255,255,255,0.85)" textAnchor="middle">ATTENDO</text>
            </svg>
          </span>
          <span className="install-title">Attendo</span>
        </div>

        <h1 className="install-greeting">Hey {name}, welcome to Attendo!</h1>
        <p className="install-sub">
          Your organisation uses Attendo for daily attendance. Download and install the
          app on your phone to check in, take breaks, and view your reports in one tap.
        </p>

        <div className="install-main">
          <div className="install-qr-box">
            <p className="install-qr-label">Scan to install</p>
            <img
              className="install-qr"
              src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${qrData}`}
              alt="QR code to install Attendo"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
            <p className="install-qr-hint">Point your phone camera at the code</p>
          </div>

          <div className="install-actions">
            <a className="btn btn-primary btn-lg" href={`${origin}/`}>Open Attendo</a>
            <button
              type="button"
              className="btn btn-whatsapp btn-lg"
              onClick={() => {
                const text = 'I want to install the Attendo app.';
                window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
              }}
            >
              Need help? Ask on WhatsApp
            </button>
          </div>
        </div>

        <div className="install-steps">
          <div className="install-step">
            <h4>Android</h4>
            <ol>
              <li>Open this link in Chrome</li>
              <li>Tap the menu (three dots)</li>
              <li>Choose <strong>Add to Home screen</strong></li>
              <li>The Attendo icon appears on your home screen</li>
            </ol>
          </div>
          <div className="install-step">
            <h4>iPhone / iPad</h4>
            <ol>
              <li>Open this link in Safari</li>
              <li>Tap the <strong>Share</strong> button</li>
              <li>Choose <strong>Add to Home Screen</strong></li>
              <li>The Attendo icon appears on your home screen</li>
            </ol>
          </div>
        </div>

        <p className="install-employee-id">
          Employee ID: <strong>{empId?.toUpperCase() || '-'}</strong>
        </p>
      </div>
    </div>
  );
}