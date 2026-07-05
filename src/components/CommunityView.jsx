export default function CommunityView() {
  return (
    <div className="rp-view" id="view-community">
      <div className="page-header"><h2>Community</h2></div>
      <div className="community-content">
        <div className="community-hero">
          <i className="fa-solid fa-people-group community-icon"></i>
          <h3>Stay connected with a community</h3>
          <button className="primary-btn">
            <i className="fa-solid fa-plus"></i> Start a Community
          </button>
        </div>
        <div className="community-list">
          <div className="community-card">
            <div className="avatar av5" style={{width: '50px', height: '50px', fontSize: '16px'}}>JJ</div>
            <div>
              <div className="comm-name">Tech Community</div>
              <div className="comm-sub">2 groups · 10 members</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
