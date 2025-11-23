export default function TestPage() {
  return (
    <div className="catch-paper-bg" style={{ minHeight: "100vh", padding: "48px" }}>
      <h1 className="catch-heading-1">The Catch Styles Test</h1>
      <p className="catch-body">If you see cream background (#fdf8ed) and serif heading, styles work.</p>
      <div className="catch-eyebrow" style={{ marginTop: "24px" }}>This should be uppercase with letter spacing</div>

      <div style={{ marginTop: "48px" }}>
        <h2 className="catch-heading-2">Heading 2 Test</h2>
        <h3 className="catch-heading-3">Heading 3 Test</h3>
        <p className="catch-body-muted">This is muted body text</p>
      </div>

      <div style={{ marginTop: "48px" }}>
        <button className="catch-button-primary">Primary Button (hover should turn blue)</button>
      </div>

      <div style={{ marginTop: "24px" }}>
        <a href="#" className="catch-nav-link">Nav Link (hover should turn blue)</a>
      </div>

      <div style={{ marginTop: "48px" }}>
        <h3 className="catch-heading-3">Category Pills Test</h3>
        <div className="catch-category-pills" style={{ marginTop: "16px" }}>
          <a href="#" className="catch-category-pill">Appetizers</a>
          <a href="#" className="catch-category-pill active">Baskets</a>
          <a href="#" className="catch-category-pill">Boils</a>
        </div>
      </div>

      <div style={{ marginTop: "48px", background: "var(--catch-tierra-reca)", padding: "24px" }}>
        <p className="catch-footer-link">Footer link test (cream on dark brown)</p>
      </div>
    </div>
  );
}
