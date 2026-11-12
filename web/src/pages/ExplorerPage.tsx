import { AssistantPanel } from '../components/AssistantPanel';
import { FiltersBar } from '../components/FiltersBar';
import { Header } from '../components/Header';

type ExplorerPageProps = {
  /** Depuis la landing « Nouvelle recherche » : focus l’input assistant. */
  focusAssistant?: boolean;
};

export function ExplorerPage({ focusAssistant = false }: ExplorerPageProps) {
  return (
    <div className="explorer">
      <Header />
      <div className="explorer__body">
        <AssistantPanel focusOnMount={focusAssistant} />
        <section className="map-zone" aria-label="Carte des signaux">
          <FiltersBar minConfiance={50} />
          <div className="map-zone__stage">
            <div className="map-zone__globe-placeholder">
              <div className="map-zone__globe-disk" aria-hidden="true" />
            </div>
            <div className="map-zone__legend">
              <div className="map-zone__legend-row">
                <span className="map-zone__dot" aria-hidden="true" />
                Tendance durable
              </div>
              <div className="map-zone__legend-row">
                <span className="map-zone__diamond" aria-hidden="true" />
                Buzz
              </div>
              <div className="map-zone__legend-row">Taille = confiance</div>
            </div>
            <p className="map-zone__hint">
              Glisser pour tourner · molette pour zoomer
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
