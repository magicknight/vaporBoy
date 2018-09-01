// Our root component
import "./index.scss";
import { Component } from "preact";

import { Pubx } from "./services/pubx";
import { PUBX_CONFIG } from "./pubx.config";
import { WasmBoy } from "wasmboy";

import { NOTIFICATION_MESSAGES } from "./notification.messages";

import VaporBoyDesktop from "./components/vaporboyDesktop/vaporboyDesktop";
import VaporBoyMobileLandscape from "./components/vaporboyMobileLandscape/vaporboyMobileLandscape";
import VaporBoyMobilePortrait from "./components/vaporboyMobilePortrait/vaporboyMobilePortrait";
import VaporBoyExpanded from "./components/vaporboyExpanded/vaporboyExpanded";
import ControlPanel from "./components/controlPanel/controlPanel";
import ConfirmationModal from "./components/confirmationModal/confirmationModal";
import Touchpad from "./components/touchpad/touchpad";
import Notification from "./components/notification/notification";
import LoadingModal from "./components/loadingModal/loadingModal";

export default class App extends Component {
  constructor() {
    super();

    // Initialize our Pubx
    PUBX_CONFIG.INITIALIZE();

    window.addEventListener("resize", () => {
      this.changeLayout();
    });

    window.addEventListener("orientationchange", () => {
      this.changeLayout();
    });

    this.changeLayout();

    this.setState({
      layout: {}
    });
  }

  componentDidMount() {
    document.addEventListener("deviceready", () => {
      console.log("Cordova Launched Device Ready!");
    });

    // Subscribe to changes
    const pubxLayoutSubscriberKey = Pubx.subscribe(
      PUBX_CONFIG.LAYOUT_KEY,
      newState => {
        // First check if expanded is not the current state
        const oldExpanded = this.state.layout.expanded;

        // You can spread and overwrite variables, while preserving ones,
        // as long is in cascading order.
        this.setState({
          ...this.state,
          layout: {
            ...this.state.layout,
            ...newState
          }
        });

        if (oldExpanded !== newState.expanded) {
          this.changeLayout();
        }
      }
    );

    this.setState({
      layout: {
        ...Pubx.get(PUBX_CONFIG.LAYOUT_KEY)
      },
      pubxLayoutSubscriberKey
    });

    // Print the beta disclaimer
    Pubx.get(PUBX_CONFIG.NOTIFICATION_KEY).showNotification(
      NOTIFICATION_MESSAGES.BETA_VERSION
    );
  }

  // Function to change out layout, called by resize events and things
  changeLayout() {
    const mobile = window.matchMedia("(max-width: 801px)").matches;
    const landscape = window.matchMedia("screen and (orientation: landscape)")
      .matches;
    const portrait = window.matchMedia("screen and (orientation: portrait)")
      .matches;

    // Clear all of our classes
    document.documentElement.className = "";

    // Get our document class list
    const documentClassList = document.documentElement.classList;

    // Add all Media query based on mobile vs desktop
    if (mobile) {
      documentClassList.add("mobile");
    } else {
      documentClassList.add("desktop");
    }
    if (landscape) {
      documentClassList.add("landscape");
    }
    if (portrait) {
      documentClassList.add("portrait");
    }

    // Add our expanded class
    if (this.state.layout && this.state.layout.expanded) {
      documentClassList.add("expanded");
    }

    Pubx.publish(PUBX_CONFIG.LAYOUT_KEY, {
      mobile: mobile,
      landscape: landscape && mobile,
      portrait: portrait && mobile
    });
  }

  render() {
    // Define our layouts
    let vaporboyDesktopLayout = <VaporBoyDesktop />;
    let vaporboyMobileLandscapeLayout = <VaporBoyMobileLandscape />;
    let vaporboyMobilePortraitLayout = <VaporBoyMobilePortrait />;
    let vaporboyExpandedLayout = <VaporBoyExpanded />;

    // Get our current layout
    let currentLayout = vaporboyDesktopLayout;
    if (this.state.layout.mobile) {
      if (this.state.layout.landscape) {
        currentLayout = vaporboyMobileLandscapeLayout;
      } else {
        currentLayout = vaporboyMobilePortraitLayout;
      }
    }

    if (this.state.layout.expanded) {
      currentLayout = vaporboyExpandedLayout;
    }

    return (
      <div>
        <ConfirmationModal />
        <ControlPanel />
        <Notification />
        <LoadingModal />
        <div aria-hidden="true">{currentLayout}</div>
        <Touchpad />
      </div>
    );
  }
}
