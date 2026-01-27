interface RegulynWidget {
  init: () => void;
}

declare global {
  interface Window {
    RegulynWidget: RegulynWidget;
  }
}

const RegulynWidget: RegulynWidget = {
  init() {
    console.log('Consent widget initialized');
  }
};

window.RegulynWidget = RegulynWidget;

export default RegulynWidget;
