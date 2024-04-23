import "./loading-overlay.css";

export function LoadingOverlay() {
  return (
    <div className="loading-overlay">
      <div className="lds-ellipsis">
        <div></div>
        <div></div>
        <div></div>
        <div></div>
      </div>

      <p>Carregando Modelos...</p>
    </div>
  );
}
