import { Component } from "preact";
import { WasmBoy } from "wasmboy";

import { Pubx } from "../../services/pubx";
import { PUBX_CONFIG } from "../../pubx.config";

import { ROMCollection } from "../../services/ROMCollection";
import ControlPanelSelect from "./controlPanelSelect/controlPanelSelect";

export default class ControlPanel extends Component {
  constructor() {
    super();
  }

  componentDidMount() {
    // Define our control panel pubx state
    const pubxControlPanelState = {
      show: false,
      rootView: false,
      viewStack: [],
      addComponentToControlPanelViewStack: (title, component) => {
        const viewStack = Pubx.get(PUBX_CONFIG.CONTROL_PANEL_KEY).viewStack;

        viewStack.push({
          title,
          view: component
        });

        Pubx.publish(PUBX_CONFIG.CONTROL_PANEL_KEY, {
          viewStack
        });
      },
      hideControlPanel: () => {
        Pubx.publish(PUBX_CONFIG.CONTROL_PANEL_KEY, {
          show: false,
          rootView: false,
          viewStack: []
        });
      }
    };

    // Send to pubx
    Pubx.publish(PUBX_CONFIG.CONTROL_PANEL_KEY, pubxControlPanelState);

    // Subscribe to changes
    const pubxControlPanelSubscriberKey = Pubx.subscribe(
      PUBX_CONFIG.CONTROL_PANEL_KEY,
      newState => {
        // Check if we are being shown/hidden
        if (
          !this.state.controlPanel ||
          (newState.show && newState.show !== this.state.controlPanel.show)
        ) {
          // Finally update our collection, for save states and the rom collection
          ROMCollection.updateCollection();
        }

        // You can spread and overwrite variables, while preserving ones,
        // as long is in cascading order.
        this.setState({
          ...this.state,
          controlPanel: {
            ...this.state.controlPanel,
            ...newState
          }
        });
      }
    );

    this.setState({
      controlPanel: {
        ...pubxControlPanelState
      },
      pubxControlPanelSubscriberKey
    });

    // Finally update our collection, for save states and the rom collection
    ROMCollection.updateCollection();
  }

  componentWillUnmount() {
    // unsubscribe from the state
    Pubx.unsubscribe(
      PUBX_CONFIG.CONTROL_PANEL_KEY,
      this.state.pubxControlPanelSubscriberKey
    );
  }

  goToPreviousView() {
    const viewStack = this.state.controlPanel.viewStack;
    viewStack.pop();

    Pubx.publish(PUBX_CONFIG.CONTROL_PANEL_KEY, {
      viewStack
    });
  }

  render() {
    if (!this.state.controlPanel || !this.state.controlPanel.show) {
      return <div />;
    }

    // Next, check if we do have a base component view in the props
    let currentView = <ControlPanelSelect />;
    let currentTitle = "Control Panel";

    // Lastly, set the current view to the last item on the view stack
    if (this.state.controlPanel.viewStack.length > 0) {
      currentView = this.state.controlPanel.viewStack[
        this.state.controlPanel.viewStack.length - 1
      ].view;
    }

    this.state.controlPanel.viewStack.forEach(view => {
      currentTitle += ` - ${view.title}`;
    });

    return (
      <div class="control-panel">
        <div class="control-panel__modal">
          <div class="aesthetic-windows-95-modal">
            <div class="aesthetic-windows-95-modal-title-bar">
              <div class="aesthetic-windows-95-modal-title-bar-text">
                {currentTitle}
              </div>

              <div class="aesthetic-windows-95-modal-title-bar-controls">
                <div class="aesthetic-windows-95-button-title-bar">
                  <button
                    onclick={() => this.state.controlPanel.hideControlPanel()}
                  >
                    X
                  </button>
                </div>
              </div>
            </div>

            <div class="aesthetic-windows-95-modal-content">
              <div class="control-panel__modal__controls">
                <div class="aesthetic-windows-95-button">
                  <button
                    disabled={this.state.controlPanel.viewStack.length <= 0}
                    onclick={() => this.goToPreviousView()}
                  >
                    ⬅️
                  </button>
                </div>
              </div>

              <hr />

              <div class="control-panel__modal__view">{currentView}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
