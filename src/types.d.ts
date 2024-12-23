/**
 * User configuration of Image block tunes. Allows to add custom tunes through the config
 */
export type ActionConfig = {
    /**
     * The name of the tune.
     */
    name: string;

    /**
     * The icon for the tune. Should be an SVG string.
     */
    icon: string;

    /**
     * The title of the tune. This will be displayed in the UI.
     */
    title: string;

    /**
     * An optional flag indicating whether the tune is a toggle (true) or not (false).
     */
    toggle?: boolean;

    /**
     * An optional action function to be executed when the tune is activated.
     */
    action?: Function;
}

export type Tool360MediaData = {
    caption: string;
    // stretched: boolean;
    file: {
        url: string;
    }
}