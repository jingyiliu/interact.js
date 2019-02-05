import browser from '@interactjs/utils/browser';
import domObjects from '@interactjs/utils/domObjects';
import events from '@interactjs/utils/events';
import finder from '@interactjs/utils/interactionFinder';
import pointerUtils from '@interactjs/utils/pointerUtils';
import Signals from '@interactjs/utils/Signals';
import InteractionBase from './Interaction';
const methodNames = [
    'pointerDown', 'pointerMove', 'pointerUp',
    'updatePointer', 'removePointer', 'windowBlur',
];
function install(scope) {
    const signals = new Signals();
    const listeners = {};
    for (const method of methodNames) {
        listeners[method] = doOnInteractions(method, scope);
    }
    const pEventTypes = browser.pEventTypes;
    const eventMap = {};
    if (domObjects.PointerEvent) {
        eventMap[pEventTypes.down] = listeners.pointerDown;
        eventMap[pEventTypes.move] = listeners.pointerMove;
        eventMap[pEventTypes.up] = listeners.pointerUp;
        eventMap[pEventTypes.cancel] = listeners.pointerUp;
    }
    else {
        eventMap.mousedown = listeners.pointerDown;
        eventMap.mousemove = listeners.pointerMove;
        eventMap.mouseup = listeners.pointerUp;
        eventMap.touchstart = listeners.pointerDown;
        eventMap.touchmove = listeners.pointerMove;
        eventMap.touchend = listeners.pointerUp;
        eventMap.touchcancel = listeners.pointerUp;
    }
    eventMap.blur = (event) => {
        for (const interaction of scope.interactions.list) {
            interaction.documentBlur(event);
        }
    };
    scope.signals.on('add-document', onDocSignal);
    scope.signals.on('remove-document', onDocSignal);
    // for ignoring browser's simulated mouse events
    scope.prevTouchTime = 0;
    scope.Interaction = class Interaction extends InteractionBase {
        get pointerMoveTolerance() {
            return scope.interactions.pointerMoveTolerance;
        }
        set pointerMoveTolerance(value) {
            scope.interactions.pointerMoveTolerance = value;
        }
    };
    scope.interactions = {
        signals,
        // all active and idle interactions
        list: [],
        new(options) {
            options.signals = signals;
            return new scope.Interaction(options);
        },
        listeners,
        eventMap,
        pointerMoveTolerance: 1,
    };
}
function doOnInteractions(method, scope) {
    return function (event) {
        const interactions = scope.interactions.list;
        const pointerType = pointerUtils.getPointerType(event);
        const [eventTarget, curEventTarget] = pointerUtils.getEventTargets(event);
        const matches = []; // [ [pointer, interaction], ...]
        if (browser.supportsTouch && /touch/.test(event.type)) {
            scope.prevTouchTime = new Date().getTime();
            for (const changedTouch of event.changedTouches) {
                const pointer = changedTouch;
                const pointerId = pointerUtils.getPointerId(pointer);
                const searchDetails = {
                    pointer,
                    pointerId,
                    pointerType,
                    eventType: event.type,
                    eventTarget,
                    curEventTarget,
                    scope,
                };
                const interaction = getInteraction(searchDetails);
                matches.push([
                    searchDetails.pointer,
                    searchDetails.eventTarget,
                    searchDetails.curEventTarget,
                    interaction,
                ]);
            }
        }
        else {
            let invalidPointer = false;
            if (!browser.supportsPointerEvent && /mouse/.test(event.type)) {
                // ignore mouse events while touch interactions are active
                for (let i = 0; i < interactions.length && !invalidPointer; i++) {
                    invalidPointer = interactions[i].pointerType !== 'mouse' && interactions[i].pointerIsDown;
                }
                // try to ignore mouse events that are simulated by the browser
                // after a touch event
                invalidPointer = invalidPointer ||
                    (new Date().getTime() - scope.prevTouchTime < 500) ||
                    // on iOS and Firefox Mobile, MouseEvent.timeStamp is zero if simulated
                    event.timeStamp === 0;
            }
            if (!invalidPointer) {
                const searchDetails = {
                    pointer: event,
                    pointerId: pointerUtils.getPointerId(event),
                    pointerType,
                    eventType: event.type,
                    curEventTarget,
                    eventTarget,
                    scope,
                };
                const interaction = getInteraction(searchDetails);
                matches.push([
                    searchDetails.pointer,
                    searchDetails.eventTarget,
                    searchDetails.curEventTarget,
                    interaction,
                ]);
            }
        }
        // eslint-disable-next-line no-shadow
        for (const [pointer, eventTarget, curEventTarget, interaction] of matches) {
            interaction[method](pointer, event, eventTarget, curEventTarget);
        }
    };
}
function getInteraction(searchDetails) {
    const { pointerType, scope } = searchDetails;
    const foundInteraction = finder.search(searchDetails);
    const signalArg = { interaction: foundInteraction, searchDetails };
    scope.interactions.signals.fire('find', signalArg);
    return signalArg.interaction || newInteraction({ pointerType }, scope);
}
export function newInteraction(options, scope) {
    const interaction = scope.interactions.new(options);
    scope.interactions.list.push(interaction);
    return interaction;
}
function onDocSignal({ doc, scope, options }, signalName) {
    const { eventMap } = scope.interactions;
    const eventMethod = signalName.indexOf('add') === 0
        ? events.add : events.remove;
    if (scope.browser.isIOS && !options.events) {
        options.events = { passive: false };
    }
    // delegate event listener
    for (const eventType in events.delegatedEvents) {
        eventMethod(doc, eventType, events.delegateListener);
        eventMethod(doc, eventType, events.delegateUseCapture, true);
    }
    const eventOptions = options && options.events;
    for (const eventType in eventMap) {
        eventMethod(doc, eventType, eventMap[eventType], eventOptions);
    }
}
export default {
    install,
    onDocSignal,
    doOnInteractions,
    newInteraction,
    methodNames,
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW50ZXJhY3Rpb25zLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiaW50ZXJhY3Rpb25zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sT0FBTyxNQUFNLDJCQUEyQixDQUFBO0FBQy9DLE9BQU8sVUFBVSxNQUFNLDhCQUE4QixDQUFBO0FBQ3JELE9BQU8sTUFBTSxNQUFNLDBCQUEwQixDQUFBO0FBQzdDLE9BQU8sTUFBTSxNQUFNLHFDQUFxQyxDQUFBO0FBQ3hELE9BQU8sWUFBWSxNQUFNLGdDQUFnQyxDQUFBO0FBQ3pELE9BQU8sT0FBTyxNQUFNLDJCQUEyQixDQUFBO0FBQy9DLE9BQU8sZUFBZSxNQUFNLGVBQWUsQ0FBQTtBQWtCM0MsTUFBTSxXQUFXLEdBQUc7SUFDbEIsYUFBYSxFQUFFLGFBQWEsRUFBRSxXQUFXO0lBQ3pDLGVBQWUsRUFBRSxlQUFlLEVBQUUsWUFBWTtDQUMvQyxDQUFBO0FBRUQsU0FBUyxPQUFPLENBQUUsS0FBWTtJQUM1QixNQUFNLE9BQU8sR0FBRyxJQUFJLE9BQU8sRUFBRSxDQUFBO0lBRTdCLE1BQU0sU0FBUyxHQUFHLEVBQVMsQ0FBQTtJQUUzQixLQUFLLE1BQU0sTUFBTSxJQUFJLFdBQVcsRUFBRTtRQUNoQyxTQUFTLENBQUMsTUFBTSxDQUFDLEdBQUcsZ0JBQWdCLENBQUMsTUFBTSxFQUFFLEtBQUssQ0FBQyxDQUFBO0tBQ3BEO0lBRUQsTUFBTSxXQUFXLEdBQUcsT0FBTyxDQUFDLFdBQVcsQ0FBQTtJQUN2QyxNQUFNLFFBQVEsR0FBRyxFQUEwQyxDQUFBO0lBRTNELElBQUksVUFBVSxDQUFDLFlBQVksRUFBRTtRQUMzQixRQUFRLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBRyxHQUFHLFNBQVMsQ0FBQyxXQUFXLENBQUE7UUFDcEQsUUFBUSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUcsR0FBRyxTQUFTLENBQUMsV0FBVyxDQUFBO1FBQ3BELFFBQVEsQ0FBQyxXQUFXLENBQUMsRUFBRSxDQUFLLEdBQUcsU0FBUyxDQUFDLFNBQVMsQ0FBQTtRQUNsRCxRQUFRLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxHQUFHLFNBQVMsQ0FBQyxTQUFTLENBQUE7S0FDbkQ7U0FDSTtRQUNILFFBQVEsQ0FBQyxTQUFTLEdBQUssU0FBUyxDQUFDLFdBQVcsQ0FBQTtRQUM1QyxRQUFRLENBQUMsU0FBUyxHQUFLLFNBQVMsQ0FBQyxXQUFXLENBQUE7UUFDNUMsUUFBUSxDQUFDLE9BQU8sR0FBTyxTQUFTLENBQUMsU0FBUyxDQUFBO1FBRTFDLFFBQVEsQ0FBQyxVQUFVLEdBQUksU0FBUyxDQUFDLFdBQVcsQ0FBQTtRQUM1QyxRQUFRLENBQUMsU0FBUyxHQUFLLFNBQVMsQ0FBQyxXQUFXLENBQUE7UUFDNUMsUUFBUSxDQUFDLFFBQVEsR0FBTSxTQUFTLENBQUMsU0FBUyxDQUFBO1FBQzFDLFFBQVEsQ0FBQyxXQUFXLEdBQUcsU0FBUyxDQUFDLFNBQVMsQ0FBQTtLQUMzQztJQUVELFFBQVEsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxLQUFLLEVBQUUsRUFBRTtRQUN4QixLQUFLLE1BQU0sV0FBVyxJQUFJLEtBQUssQ0FBQyxZQUFZLENBQUMsSUFBSSxFQUFFO1lBQ2pELFdBQVcsQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLENBQUE7U0FDaEM7SUFDSCxDQUFDLENBQUE7SUFFRCxLQUFLLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxjQUFjLEVBQUUsV0FBVyxDQUFDLENBQUE7SUFDN0MsS0FBSyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsaUJBQWlCLEVBQUUsV0FBVyxDQUFDLENBQUE7SUFFaEQsZ0RBQWdEO0lBQ2hELEtBQUssQ0FBQyxhQUFhLEdBQUcsQ0FBQyxDQUFBO0lBRXZCLEtBQUssQ0FBQyxXQUFXLEdBQUcsTUFBTSxXQUFZLFNBQVEsZUFBZTtRQUMzRCxJQUFJLG9CQUFvQjtZQUN0QixPQUFPLEtBQUssQ0FBQyxZQUFZLENBQUMsb0JBQW9CLENBQUE7UUFDaEQsQ0FBQztRQUVELElBQUksb0JBQW9CLENBQUUsS0FBSztZQUM3QixLQUFLLENBQUMsWUFBWSxDQUFDLG9CQUFvQixHQUFHLEtBQUssQ0FBQTtRQUNqRCxDQUFDO0tBQ0YsQ0FBQTtJQUNELEtBQUssQ0FBQyxZQUFZLEdBQUc7UUFDbkIsT0FBTztRQUNQLG1DQUFtQztRQUNuQyxJQUFJLEVBQUUsRUFBRTtRQUNSLEdBQUcsQ0FBRSxPQUFPO1lBQ1YsT0FBTyxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUE7WUFFekIsT0FBTyxJQUFJLEtBQUssQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLENBQUE7UUFDdkMsQ0FBQztRQUNELFNBQVM7UUFDVCxRQUFRO1FBQ1Isb0JBQW9CLEVBQUUsQ0FBQztLQUN4QixDQUFBO0FBQ0gsQ0FBQztBQUVELFNBQVMsZ0JBQWdCLENBQUUsTUFBTSxFQUFFLEtBQUs7SUFDdEMsT0FBTyxVQUFVLEtBQUs7UUFDcEIsTUFBTSxZQUFZLEdBQUcsS0FBSyxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUE7UUFFNUMsTUFBTSxXQUFXLEdBQUcsWUFBWSxDQUFDLGNBQWMsQ0FBQyxLQUFLLENBQUMsQ0FBQTtRQUN0RCxNQUFNLENBQUMsV0FBVyxFQUFFLGNBQWMsQ0FBQyxHQUFHLFlBQVksQ0FBQyxlQUFlLENBQUMsS0FBSyxDQUFDLENBQUE7UUFDekUsTUFBTSxPQUFPLEdBQUcsRUFBRSxDQUFBLENBQUMsaUNBQWlDO1FBRXBELElBQUksT0FBTyxDQUFDLGFBQWEsSUFBSSxPQUFPLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsRUFBRTtZQUNyRCxLQUFLLENBQUMsYUFBYSxHQUFHLElBQUksSUFBSSxFQUFFLENBQUMsT0FBTyxFQUFFLENBQUE7WUFFMUMsS0FBSyxNQUFNLFlBQVksSUFBSSxLQUFLLENBQUMsY0FBYyxFQUFFO2dCQUMvQyxNQUFNLE9BQU8sR0FBRyxZQUFZLENBQUE7Z0JBQzVCLE1BQU0sU0FBUyxHQUFHLFlBQVksQ0FBQyxZQUFZLENBQUMsT0FBTyxDQUFDLENBQUE7Z0JBQ3BELE1BQU0sYUFBYSxHQUFHO29CQUNwQixPQUFPO29CQUNQLFNBQVM7b0JBQ1QsV0FBVztvQkFDWCxTQUFTLEVBQUUsS0FBSyxDQUFDLElBQUk7b0JBQ3JCLFdBQVc7b0JBQ1gsY0FBYztvQkFDZCxLQUFLO2lCQUNOLENBQUE7Z0JBQ0QsTUFBTSxXQUFXLEdBQUcsY0FBYyxDQUFDLGFBQWEsQ0FBQyxDQUFBO2dCQUVqRCxPQUFPLENBQUMsSUFBSSxDQUFDO29CQUNYLGFBQWEsQ0FBQyxPQUFPO29CQUNyQixhQUFhLENBQUMsV0FBVztvQkFDekIsYUFBYSxDQUFDLGNBQWM7b0JBQzVCLFdBQVc7aUJBQ1osQ0FBQyxDQUFBO2FBQ0g7U0FDRjthQUNJO1lBQ0gsSUFBSSxjQUFjLEdBQUcsS0FBSyxDQUFBO1lBRTFCLElBQUksQ0FBQyxPQUFPLENBQUMsb0JBQW9CLElBQUksT0FBTyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEVBQUU7Z0JBQzdELDBEQUEwRDtnQkFDMUQsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFlBQVksQ0FBQyxNQUFNLElBQUksQ0FBQyxjQUFjLEVBQUUsQ0FBQyxFQUFFLEVBQUU7b0JBQy9ELGNBQWMsR0FBRyxZQUFZLENBQUMsQ0FBQyxDQUFDLENBQUMsV0FBVyxLQUFLLE9BQU8sSUFBSSxZQUFZLENBQUMsQ0FBQyxDQUFDLENBQUMsYUFBYSxDQUFBO2lCQUMxRjtnQkFFRCwrREFBK0Q7Z0JBQy9ELHNCQUFzQjtnQkFDdEIsY0FBYyxHQUFHLGNBQWM7b0JBQzdCLENBQUMsSUFBSSxJQUFJLEVBQUUsQ0FBQyxPQUFPLEVBQUUsR0FBRyxLQUFLLENBQUMsYUFBYSxHQUFHLEdBQUcsQ0FBQztvQkFDbEQsdUVBQXVFO29CQUN2RSxLQUFLLENBQUMsU0FBUyxLQUFLLENBQUMsQ0FBQTthQUN4QjtZQUVELElBQUksQ0FBQyxjQUFjLEVBQUU7Z0JBQ25CLE1BQU0sYUFBYSxHQUFHO29CQUNwQixPQUFPLEVBQUUsS0FBSztvQkFDZCxTQUFTLEVBQUUsWUFBWSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUM7b0JBQzNDLFdBQVc7b0JBQ1gsU0FBUyxFQUFFLEtBQUssQ0FBQyxJQUFJO29CQUNyQixjQUFjO29CQUNkLFdBQVc7b0JBQ1gsS0FBSztpQkFDTixDQUFBO2dCQUVELE1BQU0sV0FBVyxHQUFHLGNBQWMsQ0FBQyxhQUFhLENBQUMsQ0FBQTtnQkFFakQsT0FBTyxDQUFDLElBQUksQ0FBQztvQkFDWCxhQUFhLENBQUMsT0FBTztvQkFDckIsYUFBYSxDQUFDLFdBQVc7b0JBQ3pCLGFBQWEsQ0FBQyxjQUFjO29CQUM1QixXQUFXO2lCQUNaLENBQUMsQ0FBQTthQUNIO1NBQ0Y7UUFFRCxxQ0FBcUM7UUFDckMsS0FBSyxNQUFNLENBQUMsT0FBTyxFQUFFLFdBQVcsRUFBRSxjQUFjLEVBQUUsV0FBVyxDQUFDLElBQUksT0FBTyxFQUFFO1lBQ3pFLFdBQVcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxPQUFPLEVBQUUsS0FBSyxFQUFFLFdBQVcsRUFBRSxjQUFjLENBQUMsQ0FBQTtTQUNqRTtJQUNILENBQUMsQ0FBQTtBQUNILENBQUM7QUFFRCxTQUFTLGNBQWMsQ0FBRSxhQUFhO0lBQ3BDLE1BQU0sRUFBRSxXQUFXLEVBQUUsS0FBSyxFQUFFLEdBQUcsYUFBYSxDQUFBO0lBRTVDLE1BQU0sZ0JBQWdCLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxhQUFhLENBQUMsQ0FBQTtJQUNyRCxNQUFNLFNBQVMsR0FBRyxFQUFFLFdBQVcsRUFBRSxnQkFBZ0IsRUFBRSxhQUFhLEVBQUUsQ0FBQTtJQUVsRSxLQUFLLENBQUMsWUFBWSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLFNBQVMsQ0FBQyxDQUFBO0lBRWxELE9BQU8sU0FBUyxDQUFDLFdBQVcsSUFBSSxjQUFjLENBQUMsRUFBRSxXQUFXLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQTtBQUN4RSxDQUFDO0FBRUQsTUFBTSxVQUFVLGNBQWMsQ0FBRSxPQUFPLEVBQUUsS0FBSztJQUM1QyxNQUFNLFdBQVcsR0FBRyxLQUFLLENBQUMsWUFBWSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQTtJQUVuRCxLQUFLLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUE7SUFDekMsT0FBTyxXQUFXLENBQUE7QUFDcEIsQ0FBQztBQUVELFNBQVMsV0FBVyxDQUFFLEVBQUUsR0FBRyxFQUFFLEtBQUssRUFBRSxPQUFPLEVBQUUsRUFBRSxVQUFVO0lBQ3ZELE1BQU0sRUFBRSxRQUFRLEVBQUUsR0FBRyxLQUFLLENBQUMsWUFBWSxDQUFBO0lBQ3ZDLE1BQU0sV0FBVyxHQUFHLFVBQVUsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQztRQUNqRCxDQUFDLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQTtJQUU5QixJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsS0FBSyxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRTtRQUMxQyxPQUFPLENBQUMsTUFBTSxHQUFHLEVBQUUsT0FBTyxFQUFFLEtBQUssRUFBRSxDQUFBO0tBQ3BDO0lBRUQsMEJBQTBCO0lBQzFCLEtBQUssTUFBTSxTQUFTLElBQUksTUFBTSxDQUFDLGVBQWUsRUFBRTtRQUM5QyxXQUFXLENBQUMsR0FBRyxFQUFFLFNBQVMsRUFBRSxNQUFNLENBQUMsZ0JBQWdCLENBQUMsQ0FBQTtRQUNwRCxXQUFXLENBQUMsR0FBRyxFQUFFLFNBQVMsRUFBRSxNQUFNLENBQUMsa0JBQWtCLEVBQUUsSUFBSSxDQUFDLENBQUE7S0FDN0Q7SUFFRCxNQUFNLFlBQVksR0FBRyxPQUFPLElBQUksT0FBTyxDQUFDLE1BQU0sQ0FBQTtJQUU5QyxLQUFLLE1BQU0sU0FBUyxJQUFJLFFBQVEsRUFBRTtRQUNoQyxXQUFXLENBQUMsR0FBRyxFQUFFLFNBQVMsRUFBRSxRQUFRLENBQUMsU0FBUyxDQUFDLEVBQUUsWUFBWSxDQUFDLENBQUE7S0FDL0Q7QUFDSCxDQUFDO0FBRUQsZUFBZTtJQUNiLE9BQU87SUFDUCxXQUFXO0lBQ1gsZ0JBQWdCO0lBQ2hCLGNBQWM7SUFDZCxXQUFXO0NBQ1osQ0FBQSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBicm93c2VyIGZyb20gJ0BpbnRlcmFjdGpzL3V0aWxzL2Jyb3dzZXInXG5pbXBvcnQgZG9tT2JqZWN0cyBmcm9tICdAaW50ZXJhY3Rqcy91dGlscy9kb21PYmplY3RzJ1xuaW1wb3J0IGV2ZW50cyBmcm9tICdAaW50ZXJhY3Rqcy91dGlscy9ldmVudHMnXG5pbXBvcnQgZmluZGVyIGZyb20gJ0BpbnRlcmFjdGpzL3V0aWxzL2ludGVyYWN0aW9uRmluZGVyJ1xuaW1wb3J0IHBvaW50ZXJVdGlscyBmcm9tICdAaW50ZXJhY3Rqcy91dGlscy9wb2ludGVyVXRpbHMnXG5pbXBvcnQgU2lnbmFscyBmcm9tICdAaW50ZXJhY3Rqcy91dGlscy9TaWduYWxzJ1xuaW1wb3J0IEludGVyYWN0aW9uQmFzZSBmcm9tICcuL0ludGVyYWN0aW9uJ1xuaW1wb3J0IHsgU2NvcGUgfSBmcm9tICcuL3Njb3BlJ1xuXG5kZWNsYXJlIG1vZHVsZSAnQGludGVyYWN0anMvY29yZS9zY29wZScge1xuICBpbnRlcmZhY2UgU2NvcGUge1xuICAgIEludGVyYWN0aW9uOiB0eXBlb2YgSW50ZXJhY3Rpb25CYXNlXG4gICAgaW50ZXJhY3Rpb25zOiB7XG4gICAgICBzaWduYWxzOiBTaWduYWxzXG4gICAgICBuZXc6IChvcHRpb25zOiBhbnkpID0+IEludGVyYWN0aW9uQmFzZVxuICAgICAgbGlzdDogSW50ZXJhY3Rpb25CYXNlW11cbiAgICAgIGxpc3RlbmVyczogeyBbdHlwZTogc3RyaW5nXTogSW50ZXJhY3QuTGlzdGVuZXIgfVxuICAgICAgZXZlbnRNYXA6IGFueVxuICAgICAgcG9pbnRlck1vdmVUb2xlcmFuY2U6IG51bWJlclxuICAgIH1cbiAgICBwcmV2VG91Y2hUaW1lOiBudW1iZXJcbiAgfVxufVxuXG5jb25zdCBtZXRob2ROYW1lcyA9IFtcbiAgJ3BvaW50ZXJEb3duJywgJ3BvaW50ZXJNb3ZlJywgJ3BvaW50ZXJVcCcsXG4gICd1cGRhdGVQb2ludGVyJywgJ3JlbW92ZVBvaW50ZXInLCAnd2luZG93Qmx1cicsXG5dXG5cbmZ1bmN0aW9uIGluc3RhbGwgKHNjb3BlOiBTY29wZSkge1xuICBjb25zdCBzaWduYWxzID0gbmV3IFNpZ25hbHMoKVxuXG4gIGNvbnN0IGxpc3RlbmVycyA9IHt9IGFzIGFueVxuXG4gIGZvciAoY29uc3QgbWV0aG9kIG9mIG1ldGhvZE5hbWVzKSB7XG4gICAgbGlzdGVuZXJzW21ldGhvZF0gPSBkb09uSW50ZXJhY3Rpb25zKG1ldGhvZCwgc2NvcGUpXG4gIH1cblxuICBjb25zdCBwRXZlbnRUeXBlcyA9IGJyb3dzZXIucEV2ZW50VHlwZXNcbiAgY29uc3QgZXZlbnRNYXAgPSB7fSBhcyB7IFtrZXk6IHN0cmluZ106IEludGVyYWN0Lkxpc3RlbmVyIH1cblxuICBpZiAoZG9tT2JqZWN0cy5Qb2ludGVyRXZlbnQpIHtcbiAgICBldmVudE1hcFtwRXZlbnRUeXBlcy5kb3duICBdID0gbGlzdGVuZXJzLnBvaW50ZXJEb3duXG4gICAgZXZlbnRNYXBbcEV2ZW50VHlwZXMubW92ZSAgXSA9IGxpc3RlbmVycy5wb2ludGVyTW92ZVxuICAgIGV2ZW50TWFwW3BFdmVudFR5cGVzLnVwICAgIF0gPSBsaXN0ZW5lcnMucG9pbnRlclVwXG4gICAgZXZlbnRNYXBbcEV2ZW50VHlwZXMuY2FuY2VsXSA9IGxpc3RlbmVycy5wb2ludGVyVXBcbiAgfVxuICBlbHNlIHtcbiAgICBldmVudE1hcC5tb3VzZWRvd24gICA9IGxpc3RlbmVycy5wb2ludGVyRG93blxuICAgIGV2ZW50TWFwLm1vdXNlbW92ZSAgID0gbGlzdGVuZXJzLnBvaW50ZXJNb3ZlXG4gICAgZXZlbnRNYXAubW91c2V1cCAgICAgPSBsaXN0ZW5lcnMucG9pbnRlclVwXG5cbiAgICBldmVudE1hcC50b3VjaHN0YXJ0ICA9IGxpc3RlbmVycy5wb2ludGVyRG93blxuICAgIGV2ZW50TWFwLnRvdWNobW92ZSAgID0gbGlzdGVuZXJzLnBvaW50ZXJNb3ZlXG4gICAgZXZlbnRNYXAudG91Y2hlbmQgICAgPSBsaXN0ZW5lcnMucG9pbnRlclVwXG4gICAgZXZlbnRNYXAudG91Y2hjYW5jZWwgPSBsaXN0ZW5lcnMucG9pbnRlclVwXG4gIH1cblxuICBldmVudE1hcC5ibHVyID0gKGV2ZW50KSA9PiB7XG4gICAgZm9yIChjb25zdCBpbnRlcmFjdGlvbiBvZiBzY29wZS5pbnRlcmFjdGlvbnMubGlzdCkge1xuICAgICAgaW50ZXJhY3Rpb24uZG9jdW1lbnRCbHVyKGV2ZW50KVxuICAgIH1cbiAgfVxuXG4gIHNjb3BlLnNpZ25hbHMub24oJ2FkZC1kb2N1bWVudCcsIG9uRG9jU2lnbmFsKVxuICBzY29wZS5zaWduYWxzLm9uKCdyZW1vdmUtZG9jdW1lbnQnLCBvbkRvY1NpZ25hbClcblxuICAvLyBmb3IgaWdub3JpbmcgYnJvd3NlcidzIHNpbXVsYXRlZCBtb3VzZSBldmVudHNcbiAgc2NvcGUucHJldlRvdWNoVGltZSA9IDBcblxuICBzY29wZS5JbnRlcmFjdGlvbiA9IGNsYXNzIEludGVyYWN0aW9uIGV4dGVuZHMgSW50ZXJhY3Rpb25CYXNlIHtcbiAgICBnZXQgcG9pbnRlck1vdmVUb2xlcmFuY2UgKCkge1xuICAgICAgcmV0dXJuIHNjb3BlLmludGVyYWN0aW9ucy5wb2ludGVyTW92ZVRvbGVyYW5jZVxuICAgIH1cblxuICAgIHNldCBwb2ludGVyTW92ZVRvbGVyYW5jZSAodmFsdWUpIHtcbiAgICAgIHNjb3BlLmludGVyYWN0aW9ucy5wb2ludGVyTW92ZVRvbGVyYW5jZSA9IHZhbHVlXG4gICAgfVxuICB9XG4gIHNjb3BlLmludGVyYWN0aW9ucyA9IHtcbiAgICBzaWduYWxzLFxuICAgIC8vIGFsbCBhY3RpdmUgYW5kIGlkbGUgaW50ZXJhY3Rpb25zXG4gICAgbGlzdDogW10sXG4gICAgbmV3IChvcHRpb25zKSB7XG4gICAgICBvcHRpb25zLnNpZ25hbHMgPSBzaWduYWxzXG5cbiAgICAgIHJldHVybiBuZXcgc2NvcGUuSW50ZXJhY3Rpb24ob3B0aW9ucylcbiAgICB9LFxuICAgIGxpc3RlbmVycyxcbiAgICBldmVudE1hcCxcbiAgICBwb2ludGVyTW92ZVRvbGVyYW5jZTogMSxcbiAgfVxufVxuXG5mdW5jdGlvbiBkb09uSW50ZXJhY3Rpb25zIChtZXRob2QsIHNjb3BlKSB7XG4gIHJldHVybiBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICBjb25zdCBpbnRlcmFjdGlvbnMgPSBzY29wZS5pbnRlcmFjdGlvbnMubGlzdFxuXG4gICAgY29uc3QgcG9pbnRlclR5cGUgPSBwb2ludGVyVXRpbHMuZ2V0UG9pbnRlclR5cGUoZXZlbnQpXG4gICAgY29uc3QgW2V2ZW50VGFyZ2V0LCBjdXJFdmVudFRhcmdldF0gPSBwb2ludGVyVXRpbHMuZ2V0RXZlbnRUYXJnZXRzKGV2ZW50KVxuICAgIGNvbnN0IG1hdGNoZXMgPSBbXSAvLyBbIFtwb2ludGVyLCBpbnRlcmFjdGlvbl0sIC4uLl1cblxuICAgIGlmIChicm93c2VyLnN1cHBvcnRzVG91Y2ggJiYgL3RvdWNoLy50ZXN0KGV2ZW50LnR5cGUpKSB7XG4gICAgICBzY29wZS5wcmV2VG91Y2hUaW1lID0gbmV3IERhdGUoKS5nZXRUaW1lKClcblxuICAgICAgZm9yIChjb25zdCBjaGFuZ2VkVG91Y2ggb2YgZXZlbnQuY2hhbmdlZFRvdWNoZXMpIHtcbiAgICAgICAgY29uc3QgcG9pbnRlciA9IGNoYW5nZWRUb3VjaFxuICAgICAgICBjb25zdCBwb2ludGVySWQgPSBwb2ludGVyVXRpbHMuZ2V0UG9pbnRlcklkKHBvaW50ZXIpXG4gICAgICAgIGNvbnN0IHNlYXJjaERldGFpbHMgPSB7XG4gICAgICAgICAgcG9pbnRlcixcbiAgICAgICAgICBwb2ludGVySWQsXG4gICAgICAgICAgcG9pbnRlclR5cGUsXG4gICAgICAgICAgZXZlbnRUeXBlOiBldmVudC50eXBlLFxuICAgICAgICAgIGV2ZW50VGFyZ2V0LFxuICAgICAgICAgIGN1ckV2ZW50VGFyZ2V0LFxuICAgICAgICAgIHNjb3BlLFxuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGludGVyYWN0aW9uID0gZ2V0SW50ZXJhY3Rpb24oc2VhcmNoRGV0YWlscylcblxuICAgICAgICBtYXRjaGVzLnB1c2goW1xuICAgICAgICAgIHNlYXJjaERldGFpbHMucG9pbnRlcixcbiAgICAgICAgICBzZWFyY2hEZXRhaWxzLmV2ZW50VGFyZ2V0LFxuICAgICAgICAgIHNlYXJjaERldGFpbHMuY3VyRXZlbnRUYXJnZXQsXG4gICAgICAgICAgaW50ZXJhY3Rpb24sXG4gICAgICAgIF0pXG4gICAgICB9XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgbGV0IGludmFsaWRQb2ludGVyID0gZmFsc2VcblxuICAgICAgaWYgKCFicm93c2VyLnN1cHBvcnRzUG9pbnRlckV2ZW50ICYmIC9tb3VzZS8udGVzdChldmVudC50eXBlKSkge1xuICAgICAgICAvLyBpZ25vcmUgbW91c2UgZXZlbnRzIHdoaWxlIHRvdWNoIGludGVyYWN0aW9ucyBhcmUgYWN0aXZlXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgaW50ZXJhY3Rpb25zLmxlbmd0aCAmJiAhaW52YWxpZFBvaW50ZXI7IGkrKykge1xuICAgICAgICAgIGludmFsaWRQb2ludGVyID0gaW50ZXJhY3Rpb25zW2ldLnBvaW50ZXJUeXBlICE9PSAnbW91c2UnICYmIGludGVyYWN0aW9uc1tpXS5wb2ludGVySXNEb3duXG4gICAgICAgIH1cblxuICAgICAgICAvLyB0cnkgdG8gaWdub3JlIG1vdXNlIGV2ZW50cyB0aGF0IGFyZSBzaW11bGF0ZWQgYnkgdGhlIGJyb3dzZXJcbiAgICAgICAgLy8gYWZ0ZXIgYSB0b3VjaCBldmVudFxuICAgICAgICBpbnZhbGlkUG9pbnRlciA9IGludmFsaWRQb2ludGVyIHx8XG4gICAgICAgICAgKG5ldyBEYXRlKCkuZ2V0VGltZSgpIC0gc2NvcGUucHJldlRvdWNoVGltZSA8IDUwMCkgfHxcbiAgICAgICAgICAvLyBvbiBpT1MgYW5kIEZpcmVmb3ggTW9iaWxlLCBNb3VzZUV2ZW50LnRpbWVTdGFtcCBpcyB6ZXJvIGlmIHNpbXVsYXRlZFxuICAgICAgICAgIGV2ZW50LnRpbWVTdGFtcCA9PT0gMFxuICAgICAgfVxuXG4gICAgICBpZiAoIWludmFsaWRQb2ludGVyKSB7XG4gICAgICAgIGNvbnN0IHNlYXJjaERldGFpbHMgPSB7XG4gICAgICAgICAgcG9pbnRlcjogZXZlbnQsXG4gICAgICAgICAgcG9pbnRlcklkOiBwb2ludGVyVXRpbHMuZ2V0UG9pbnRlcklkKGV2ZW50KSxcbiAgICAgICAgICBwb2ludGVyVHlwZSxcbiAgICAgICAgICBldmVudFR5cGU6IGV2ZW50LnR5cGUsXG4gICAgICAgICAgY3VyRXZlbnRUYXJnZXQsXG4gICAgICAgICAgZXZlbnRUYXJnZXQsXG4gICAgICAgICAgc2NvcGUsXG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBpbnRlcmFjdGlvbiA9IGdldEludGVyYWN0aW9uKHNlYXJjaERldGFpbHMpXG5cbiAgICAgICAgbWF0Y2hlcy5wdXNoKFtcbiAgICAgICAgICBzZWFyY2hEZXRhaWxzLnBvaW50ZXIsXG4gICAgICAgICAgc2VhcmNoRGV0YWlscy5ldmVudFRhcmdldCxcbiAgICAgICAgICBzZWFyY2hEZXRhaWxzLmN1ckV2ZW50VGFyZ2V0LFxuICAgICAgICAgIGludGVyYWN0aW9uLFxuICAgICAgICBdKVxuICAgICAgfVxuICAgIH1cblxuICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1zaGFkb3dcbiAgICBmb3IgKGNvbnN0IFtwb2ludGVyLCBldmVudFRhcmdldCwgY3VyRXZlbnRUYXJnZXQsIGludGVyYWN0aW9uXSBvZiBtYXRjaGVzKSB7XG4gICAgICBpbnRlcmFjdGlvblttZXRob2RdKHBvaW50ZXIsIGV2ZW50LCBldmVudFRhcmdldCwgY3VyRXZlbnRUYXJnZXQpXG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIGdldEludGVyYWN0aW9uIChzZWFyY2hEZXRhaWxzKSB7XG4gIGNvbnN0IHsgcG9pbnRlclR5cGUsIHNjb3BlIH0gPSBzZWFyY2hEZXRhaWxzXG5cbiAgY29uc3QgZm91bmRJbnRlcmFjdGlvbiA9IGZpbmRlci5zZWFyY2goc2VhcmNoRGV0YWlscylcbiAgY29uc3Qgc2lnbmFsQXJnID0geyBpbnRlcmFjdGlvbjogZm91bmRJbnRlcmFjdGlvbiwgc2VhcmNoRGV0YWlscyB9XG5cbiAgc2NvcGUuaW50ZXJhY3Rpb25zLnNpZ25hbHMuZmlyZSgnZmluZCcsIHNpZ25hbEFyZylcblxuICByZXR1cm4gc2lnbmFsQXJnLmludGVyYWN0aW9uIHx8IG5ld0ludGVyYWN0aW9uKHsgcG9pbnRlclR5cGUgfSwgc2NvcGUpXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBuZXdJbnRlcmFjdGlvbiAob3B0aW9ucywgc2NvcGUpIHtcbiAgY29uc3QgaW50ZXJhY3Rpb24gPSBzY29wZS5pbnRlcmFjdGlvbnMubmV3KG9wdGlvbnMpXG5cbiAgc2NvcGUuaW50ZXJhY3Rpb25zLmxpc3QucHVzaChpbnRlcmFjdGlvbilcbiAgcmV0dXJuIGludGVyYWN0aW9uXG59XG5cbmZ1bmN0aW9uIG9uRG9jU2lnbmFsICh7IGRvYywgc2NvcGUsIG9wdGlvbnMgfSwgc2lnbmFsTmFtZSkge1xuICBjb25zdCB7IGV2ZW50TWFwIH0gPSBzY29wZS5pbnRlcmFjdGlvbnNcbiAgY29uc3QgZXZlbnRNZXRob2QgPSBzaWduYWxOYW1lLmluZGV4T2YoJ2FkZCcpID09PSAwXG4gICAgPyBldmVudHMuYWRkIDogZXZlbnRzLnJlbW92ZVxuXG4gIGlmIChzY29wZS5icm93c2VyLmlzSU9TICYmICFvcHRpb25zLmV2ZW50cykge1xuICAgIG9wdGlvbnMuZXZlbnRzID0geyBwYXNzaXZlOiBmYWxzZSB9XG4gIH1cblxuICAvLyBkZWxlZ2F0ZSBldmVudCBsaXN0ZW5lclxuICBmb3IgKGNvbnN0IGV2ZW50VHlwZSBpbiBldmVudHMuZGVsZWdhdGVkRXZlbnRzKSB7XG4gICAgZXZlbnRNZXRob2QoZG9jLCBldmVudFR5cGUsIGV2ZW50cy5kZWxlZ2F0ZUxpc3RlbmVyKVxuICAgIGV2ZW50TWV0aG9kKGRvYywgZXZlbnRUeXBlLCBldmVudHMuZGVsZWdhdGVVc2VDYXB0dXJlLCB0cnVlKVxuICB9XG5cbiAgY29uc3QgZXZlbnRPcHRpb25zID0gb3B0aW9ucyAmJiBvcHRpb25zLmV2ZW50c1xuXG4gIGZvciAoY29uc3QgZXZlbnRUeXBlIGluIGV2ZW50TWFwKSB7XG4gICAgZXZlbnRNZXRob2QoZG9jLCBldmVudFR5cGUsIGV2ZW50TWFwW2V2ZW50VHlwZV0sIGV2ZW50T3B0aW9ucylcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCB7XG4gIGluc3RhbGwsXG4gIG9uRG9jU2lnbmFsLFxuICBkb09uSW50ZXJhY3Rpb25zLFxuICBuZXdJbnRlcmFjdGlvbixcbiAgbWV0aG9kTmFtZXMsXG59XG4iXX0=