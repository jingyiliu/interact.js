import { Action, Interaction } from '@interactjs/core/Interaction';
import { ActionName, Scope } from '@interactjs/core/scope';
export declare type EdgeName = 'top' | 'left' | 'bottom' | 'right';
export declare type ResizableMethod = (options?: Interact.OrBoolean<Interact.ResizableOptions> | boolean) => Interact.Interactable | Interact.ResizableOptions;
declare module '@interactjs/core/Interactable' {
    interface Interactable {
        resizable: ResizableMethod;
    }
}
declare module '@interactjs/core/Interaction' {
    interface Interaction {
        resizeAxes: 'x' | 'y' | 'xy';
    }
}
declare module '@interactjs/core/defaultOptions' {
    interface ActionDefaults {
        resize?: Interact.ResizableOptions;
    }
}
declare module '@interactjs/core/scope' {
    interface Actions {
        [ActionName.Resize]?: typeof resize;
    }
    enum ActionName {
        Resize = "resize"
    }
}
export interface ResizeEvent extends Interact.InteractEvent<ActionName.Resize> {
    deltaRect?: Interact.Rect;
    rect?: Interact.Rect;
}
declare function install(scope: Scope): void;
declare const resize: {
    install: typeof install;
    defaults: import("../types").ResizableOptions;
    checker(_pointer: import("../types").PointerType, _event: import("../types").PointerEventType, interactable: import("@interactjs/core/Interactable").Interactable, element: Element, interaction: Interaction, rect: import("../types").Rect): {
        name: string;
        edges: {
            [edge: string]: boolean;
        };
        axes?: undefined;
    } | {
        name: string;
        axes: string;
        edges?: undefined;
    };
    cursors: {
        x: string;
        y: string;
        xy: string;
        top: string;
        left: string;
        bottom: string;
        right: string;
        topleft: string;
        bottomright: string;
        topright: string;
        bottomleft: string;
    };
    getCursor(action: Action): string;
    defaultMargin: number;
};
export default resize;
