export default function CallsView() {
  return (
    <div className="rp-view" id="view-calls">
      <div className="page-header">
        <h2>Calls</h2>
        <div className="page-header-tabs">
          <button className="ptab active" data-cf="all">All</button>
          <button className="ptab" data-cf="missed">Missed</button>
          <button className="ptab" data-cf="incoming">In</button>
          <button className="ptab" data-cf="outgoing">Out</button>
        </div>
      </div>
      <div className="calls-list" id="callsList">

        <div className="call-item" data-ct="missed">
          <div className="avatar av8">MO</div>
          <div className="call-item-info">
            <div className="call-name">Mom ❤️</div>
            <div className="call-detail missed"><i className="fa-solid fa-phone-missed"></i> Missed · Today 9:15 AM</div>
          </div>
          <button className="call-back-btn" title="Call back"><i className="fa-solid fa-phone"></i></button>
        </div>

        <div className="call-item" data-ct="incoming">
          <div className="avatar av7">DT</div>
          <div className="call-item-info">
            <div className="call-name">Dev Team </div>
            <div className="call-detail incoming"><i className="fa-solid fa-phone-volume"></i> Incoming · Today 8:00 AM · 12 min</div>
          </div>
          <button className="call-back-btn" title="Video call"><i className="fa-solid fa-phone"></i></button>
        </div>

        <div className="call-item" data-ct="outgoing">
          <div className="avatar av1">PC</div>
          <div className="call-item-info">
            <div className="call-name">Preetam Chemistry</div>
            <div className="call-detail outgoing"><i className="fa-solid fa-phone-arrow-up-right"></i> Outgoing · Yesterday 7:30 PM · 5 min</div>
          </div>
          <button className="call-back-btn"><i className="fa-solid fa-phone"></i></button>
        </div>

      </div>
    </div>
  );
}
