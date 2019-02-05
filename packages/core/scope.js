import * as utils from '@interactjs/utils';
import domObjects from '@interactjs/utils/domObjects';
import defaults from './defaultOptions';
import Eventable from './Eventable';
import InteractableBase from './Interactable';
import InteractEvent from './InteractEvent';
import interactions from './interactions';
const { win, browser, raf, Signals, events, } = utils;
export var ActionName;
(function (ActionName) {
})(ActionName || (ActionName = {}));
export function createScope() {
    return new Scope();
}
export class Scope {
    constructor() {
        // FIXME Signals
        this.signals = new Signals();
        this.browser = browser;
        this.events = events;
        this.utils = utils;
        this.defaults = utils.clone(defaults);
        this.Eventable = Eventable;
        this.actions = {
            names: [],
            methodDict: {},
            eventTypes: [],
        };
        this.InteractEvent = InteractEvent;
        this.interactables = new InteractableSet(this);
        // all documents being listened to
        this.documents = [];
        const scope = this;
        this.Interactable = class Interactable extends InteractableBase {
            get _defaults() { return scope.defaults; }
            set(options) {
                super.set(options);
                scope.interactables.signals.fire('set', {
                    options,
                    interactable: this,
                });
                return this;
            }
            unset() {
                super.unset();
                scope.interactables.signals.fire('unset', { interactable: this });
            }
        };
    }
    init(window) {
        return initScope(this, window);
    }
    addDocument(doc, options) {
        // do nothing if document is already known
        if (this.getDocIndex(doc) !== -1) {
            return false;
        }
        const window = win.getWindow(doc);
        options = options ? utils.extend({}, options) : {};
        this.documents.push({ doc, options });
        events.documents.push(doc);
        // don't add an unload event for the main document
        // so that the page may be cached in browser history
        if (doc !== this.document) {
            events.add(window, 'unload', this.onWindowUnload);
        }
        this.signals.fire('add-document', { doc, window, scope: this, options });
    }
    removeDocument(doc) {
        const index = this.getDocIndex(doc);
        const window = win.getWindow(doc);
        const options = this.documents[index].options;
        events.remove(window, 'unload', this.onWindowUnload);
        this.documents.splice(index, 1);
        events.documents.splice(index, 1);
        this.signals.fire('remove-document', { doc, window, scope: this, options });
    }
    onWindowUnload(event) {
        this.removeDocument(event.target);
    }
    getDocIndex(doc) {
        for (let i = 0; i < this.documents.length; i++) {
            if (this.documents[i].doc === doc) {
                return i;
            }
        }
        return -1;
    }
    getDocOptions(doc) {
        const docIndex = this.getDocIndex(doc);
        return docIndex === -1 ? null : this.documents[docIndex].options;
    }
}
class InteractableSet {
    constructor(scope) {
        this.scope = scope;
        this.signals = new utils.Signals();
        // all set interactables
        this.list = [];
    }
    new(target, options) {
        options = utils.extend(options || {}, {
            actions: this.scope.actions,
        });
        const interactable = new this.scope.Interactable(target, options, this.scope.document);
        this.scope.addDocument(interactable._doc);
        this.list.push(interactable);
        this.signals.fire('new', {
            target,
            options,
            interactable,
            win: this.scope._win,
        });
        return interactable;
    }
    indexOfElement(target, context) {
        context = context || this.scope.document;
        const list = this.list;
        for (let i = 0; i < list.length; i++) {
            const interactable = list[i];
            if (interactable.target === target && interactable._context === context) {
                return i;
            }
        }
        return -1;
    }
    get(element, options, dontCheckInContext) {
        const ret = this.list[this.indexOfElement(element, options && options.context)];
        return ret && (utils.is.string(element) || dontCheckInContext || ret.inContext(element)) ? ret : null;
    }
    forEachMatch(element, callback) {
        for (const interactable of this.list) {
            let ret;
            if ((utils.is.string(interactable.target)
                // target is a selector and the element matches
                ? (utils.is.element(element) && utils.dom.matchesSelector(element, interactable.target))
                // target is the element
                : element === interactable.target) &&
                // the element is in context
                (interactable.inContext(element))) {
                ret = callback(interactable);
            }
            if (ret !== undefined) {
                return ret;
            }
        }
    }
}
export function initScope(scope, window) {
    win.init(window);
    domObjects.init(window);
    browser.init(window);
    raf.init(window);
    events.init(window);
    interactions.install(scope);
    scope.document = window.document;
    return scope;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2NvcGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJzY29wZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEtBQUssS0FBSyxNQUFNLG1CQUFtQixDQUFBO0FBQzFDLE9BQU8sVUFBVSxNQUFNLDhCQUE4QixDQUFBO0FBQ3JELE9BQU8sUUFBUSxNQUFNLGtCQUFrQixDQUFBO0FBQ3ZDLE9BQU8sU0FBUyxNQUFNLGFBQWEsQ0FBQTtBQUNuQyxPQUFPLGdCQUFnQixNQUFNLGdCQUFnQixDQUFBO0FBQzdDLE9BQU8sYUFBYSxNQUFNLGlCQUFpQixDQUFBO0FBQzNDLE9BQU8sWUFBWSxNQUFNLGdCQUFnQixDQUFBO0FBRXpDLE1BQU0sRUFDSixHQUFHLEVBQ0gsT0FBTyxFQUNQLEdBQUcsRUFDSCxPQUFPLEVBQ1AsTUFBTSxHQUNQLEdBQUcsS0FBSyxDQUFBO0FBRVQsTUFBTSxDQUFOLElBQVksVUFDWDtBQURELFdBQVksVUFBVTtBQUN0QixDQUFDLEVBRFcsVUFBVSxLQUFWLFVBQVUsUUFDckI7QUFRRCxNQUFNLFVBQVUsV0FBVztJQUN6QixPQUFPLElBQUksS0FBSyxFQUFFLENBQUE7QUFDcEIsQ0FBQztBQUlELE1BQU0sT0FBTyxLQUFLO0lBMkJoQjtRQTFCQSxnQkFBZ0I7UUFDaEIsWUFBTyxHQUFHLElBQUksT0FBTyxFQUFFLENBQUE7UUFDdkIsWUFBTyxHQUFHLE9BQU8sQ0FBQTtRQUNqQixXQUFNLEdBQUcsTUFBTSxDQUFBO1FBQ2YsVUFBSyxHQUFHLEtBQUssQ0FBQTtRQUNiLGFBQVEsR0FBYSxLQUFLLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBYSxDQUFBO1FBQ3RELGNBQVMsR0FBRyxTQUFTLENBQUE7UUFDckIsWUFBTyxHQUFZO1lBQ2pCLEtBQUssRUFBRSxFQUFFO1lBQ1QsVUFBVSxFQUFFLEVBQUU7WUFDZCxVQUFVLEVBQUUsRUFBRTtTQUNmLENBQUE7UUFFRCxrQkFBYSxHQUFHLGFBQWEsQ0FBQTtRQUU3QixrQkFB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QTtJQUNwQixHQUFHLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFBO0lBQ2hCLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUE7SUFFbkIsWUFBWSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQTtJQUMzQixLQUFLLENBQUMsUUFBUSxHQUFHLE1BQU0sQ0FBQyxRQUFRLENBQUE7SUFFaEMsT0FBTyxLQUFLLENBQUE7QUFDZCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgdXRpbHMgZnJvbSAnQGludGVyYWN0anMvdXRpbHMnXG5pbXBvcnQgZG9tT2JqZWN0cyBmcm9tICdAaW50ZXJhY3Rqcy91dGlscy9kb21PYmplY3RzJ1xuaW1wb3J0IGRlZmF1bHRzIGZyb20gJy4vZGVmYXVsdE9wdGlvbnMnXG5pbXBvcnQgRXZlbnRhYmxlIGZyb20gJy4vRXZlbnRhYmxlJ1xuaW1wb3J0IEludGVyYWN0YWJsZUJhc2UgZnJvbSAnLi9JbnRlcmFjdGFibGUnXG5pbXBvcnQgSW50ZXJhY3RFdmVudCBmcm9tICcuL0ludGVyYWN0RXZlbnQnXG5pbXBvcnQgaW50ZXJhY3Rpb25zIGZyb20gJy4vaW50ZXJhY3Rpb25zJ1xuXG5jb25zdCB7XG4gIHdpbixcbiAgYnJvd3NlcixcbiAgcmFmLFxuICBTaWduYWxzLFxuICBldmVudHMsXG59ID0gdXRpbHNcblxuZXhwb3J0IGVudW0gQWN0aW9uTmFtZSB7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgQWN0aW9ucyB7XG4gIG5hbWVzOiBBY3Rpb25OYW1lW11cbiAgbWV0aG9kRGljdDogeyBba2V5OiBzdHJpbmddOiBzdHJpbmcgfVxuICBldmVudFR5cGVzOiBzdHJpbmdbXVxufVxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlU2NvcGUgKCkge1xuICByZXR1cm4gbmV3IFNjb3BlKClcbn1cblxuZXhwb3J0IHR5cGUgRGVmYXVsdHMgPSB0eXBlb2YgZGVmYXVsdHNcblxuZXhwb3J0IGNsYXNzIFNjb3BlIHtcbiAgLy8gRklYTUUgU2lnbmFsc1xuICBzaWduYWxzID0gbmV3IFNpZ25hbHMoKVxuICBicm93c2VyID0gYnJvd3NlclxuICBldmVudHMgPSBldmVudHNcbiAgdXRpbHMgPSB1dGlsc1xuICBkZWZhdWx0czogRGVmYXVsdHMgPSB1dGlscy5jbG9uZShkZWZhdWx0cykgYXMgRGVmYXVsdHNcbiAgRXZlbnRhYmxlID0gRXZlbnRhYmxlXG4gIGFjdGlvbnM6IEFjdGlvbnMgPSB7XG4gICAgbmFtZXM6IFtdLFxuICAgIG1ldGhvZERpY3Q6IHt9LFxuICAgIGV2ZW50VHlwZXM6IFtdLFxuICB9XG5cbiAgSW50ZXJhY3RFdmVudCA9IEludGVyYWN0RXZlbnRcbiAgSW50ZXJhY3RhYmxlITogdHlwZW9mIEludGVyYWN0YWJsZUJhc2VcbiAgaW50ZXJhY3RhYmxlcyA9IG5ldyBJbnRlcmFjdGFibGVTZXQodGhpcylcblxuICAvLyBtYWluIHdpbmRvd1xuICBfd2luITogV2luZG93XG5cbiAgLy8gbWFpbiBkb2N1bWVudFxuICBkb2N1bWVudCE6IERvY3VtZW50XG5cbiAgLy8gYWxsIGRvY3VtZW50cyBiZWluZyBsaXN0ZW5lZCB0b1xuICBkb2N1bWVudHM6IEFycmF5PHsgZG9jOiBEb2N1bWVudCwgb3B0aW9uczogYW55IH0+ID0gW11cblxuICBjb25zdHJ1Y3RvciAoKSB7XG4gICAgY29uc3Qgc2NvcGUgPSB0aGlzIGFzIFNjb3BlO1xuXG4gICAgKHRoaXMgYXMgeyBJbnRlcmFjdGFibGU6IHR5cGVvZiBJbnRlcmFjdGFibGVCYXNlIH0pLkludGVyYWN0YWJsZSA9IGNsYXNzIEludGVyYWN0YWJsZSBleHRlbmRzIEludGVyYWN0YWJsZUJhc2UgaW1wbGVtZW50cyBJbnRlcmFjdGFibGVCYXNlIHtcbiAgICAgIGdldCBfZGVmYXVsdHMgKCkgeyByZXR1cm4gc2NvcGUuZGVmYXVsdHMgfVxuXG4gICAgICBzZXQgKG9wdGlvbnM6IGFueSkge1xuICAgICAgICBzdXBlci5zZXQob3B0aW9ucylcblxuICAgICAgICBzY29wZS5pbnRlcmFjdGFibGVzLnNpZ25hbHMuZmlyZSgnc2V0Jywge1xuICAgICAgICAgIG9wdGlvbnMsXG4gICAgICAgICAgaW50ZXJhY3RhYmxlOiB0aGlzLFxuICAgICAgICB9KVxuXG4gICAgICAgIHJldHVybiB0aGlzXG4gICAgICB9XG5cbiAgICAgIHVuc2V0ICgpIHtcbiAgICAgICAgc3VwZXIudW5zZXQoKVxuICAgICAgICBzY29wZS5pbnRlcmFjdGFibGVzLnNpZ25hbHMuZmlyZSgndW5zZXQnLCB7IGludGVyYWN0YWJsZTogdGhpcyB9KVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGluaXQgKHdpbmRvdzogV2luZG93KSB7XG4gICAgcmV0dXJuIGluaXRTY29wZSh0aGlzLCB3aW5kb3cpXG4gIH1cblxuICBhZGREb2N1bWVudCAoZG9jOiBEb2N1bWVudCwgb3B0aW9ucz86IGFueSk6IHZvaWQgfCBmYWxzZSB7XG4gICAgLy8gZG8gbm90aGluZyBpZiBkb2N1bWVudCBpcyBhbHJlYWR5IGtub3duXG4gICAgaWYgKHRoaXMuZ2V0RG9jSW5kZXgoZG9jKSAhPT0gLTEpIHsgcmV0dXJuIGZhbHNlIH1cblxuICAgIGNvbnN0IHdpbmRvdyA9IHdpbi5nZXRXaW5kb3coZG9jKVxuXG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgPyB1dGlscy5leHRlbmQoe30sIG9wdGlvbnMpIDoge31cblxuICAgIHRoaXMuZG9jdW1lbnRzLnB1c2goeyBkb2MsIG9wdGlvbnMgfSlcbiAgICBldmVudHMuZG9jdW1lbnRzLnB1c2goZG9jKVxuXG4gICAgLy8gZG9uJ3QgYWRkIGFuIHVubG9hZCBldmVudCBmb3IgdGhlIG1haW4gZG9jdW1lbnRcbiAgICAvLyBzbyB0aGF0IHRoZSBwYWdlIG1heSBiZSBjYWNoZWQgaW4gYnJvd3NlciBoaXN0b3J5XG4gICAgaWYgKGRvYyAhPT0gdGhpcy5kb2N1bWVudCkge1xuICAgICAgZXZlbnRzLmFkZCh3aW5kb3csICd1bmxvYWQnLCB0aGlzLm9uV2luZG93VW5sb2FkKVxuICAgIH1cblxuICAgIHRoaXMuc2lnbmFscy5maXJlKCdhZGQtZG9jdW1lbnQnLCB7IGRvYywgd2luZG93LCBzY29wZTogdGhpcywgb3B0aW9ucyB9KVxuICB9XG5cbiAgcmVtb3ZlRG9jdW1lbnQgKGRvYzogRG9jdW1lbnQpIHtcbiAgICBjb25zdCBpbmRleCA9IHRoaXMuZ2V0RG9jSW5kZXgoZG9jKVxuXG4gICAgY29uc3Qgd2luZG93ID0gd2luLmdldFdpbmRvdyhkb2MpXG4gICAgY29uc3Qgb3B0aW9ucyA9IHRoaXMuZG9jdW1lbnRzW2luZGV4XS5vcHRpb25zXG5cbiAgICBldmVudHMucmVtb3ZlKHdpbmRvdywgJ3VubG9hZCcsIHRoaXMub25XaW5kb3dVbmxvYWQpXG5cbiAgICB0aGlzLmRvY3VtZW50cy5zcGxpY2UoaW5kZXgsIDEpXG4gICAgZXZlbnRzLmRvY3VtZW50cy5zcGxpY2UoaW5kZXgsIDEpXG5cbiAgICB0aGlzLnNpZ25hbHMuZmlyZSgncmVtb3ZlLWRvY3VtZW50JywgeyBkb2MsIHdpbmRvdywgc2NvcGU6IHRoaXMsIG9wdGlvbnMgfSlcbiAgfVxuXG4gIG9uV2luZG93VW5sb2FkIChldmVudDogRXZlbnQpIHtcbiAgICB0aGlzLnJlbW92ZURvY3VtZW50KGV2ZW50LnRhcmdldCBhcyBEb2N1bWVudClcbiAgfVxuXG4gIGdldERvY0luZGV4IChkb2M6IERvY3VtZW50KSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLmRvY3VtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgaWYgKHRoaXMuZG9jdW1lbnRzW2ldLmRvYyA9PT0gZG9jKSB7XG4gICAgICAgIHJldHVybiBpXG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIC0xXG4gIH1cblxuICBnZXREb2NPcHRpb25zIChkb2M6IERvY3VtZW50KSB7XG4gICAgY29uc3QgZG9jSW5kZXggPSB0aGlzLmdldERvY0luZGV4KGRvYylcblxuICAgIHJldHVybiBkb2NJbmRleCA9PT0gLTEgPyBudWxsIDogdGhpcy5kb2N1bWVudHNbZG9jSW5kZXhdLm9wdGlvbnNcbiAgfVxufVxuXG5jbGFzcyBJbnRlcmFjdGFibGVTZXQge1xuICBzaWduYWxzID0gbmV3IHV0aWxzLlNpZ25hbHMoKVxuXG4gIC8vIGFsbCBzZXQgaW50ZXJhY3RhYmxlc1xuICBsaXN0OiBJbnRlcmFjdGFibGVCYXNlW10gPSBbXVxuXG4gIGNvbnN0cnVjdG9yIChwcm90ZWN0ZWQgc2NvcGU6IFNjb3BlKSB7fVxuXG4gIG5ldyAodGFyZ2V0OiBJbnRlcmFjdC5UYXJnZXQsIG9wdGlvbnM6IGFueSk6IEludGVyYWN0YWJsZUJhc2Uge1xuICAgIG9wdGlvbnMgPSB1dGlscy5leHRlbmQob3B0aW9ucyB8fCB7fSwge1xuICAgICAgYWN0aW9uczogdGhpcy5zY29wZS5hY3Rpb25zLFxuICAgIH0pXG4gICAgY29uc3QgaW50ZXJhY3RhYmxlID0gbmV3IHRoaXMuc2NvcGUuSW50ZXJhY3RhYmxlKHRhcmdldCwgb3B0aW9ucywgdGhpcy5zY29wZS5kb2N1bWVudClcblxuICAgIHRoaXMuc2NvcGUuYWRkRG9jdW1lbnQoaW50ZXJhY3RhYmxlLl9kb2MpXG4gICAgdGhpcy5saXN0LnB1c2goaW50ZXJhY3RhYmxlKVxuXG4gICAgdGhpcy5zaWduYWxzLmZpcmUoJ25ldycsIHtcbiAgICAgIHRhcmdldCxcbiAgICAgIG9wdGlvbnMsXG4gICAgICBpbnRlcmFjdGFibGUsXG4gICAgICB3aW46IHRoaXMuc2NvcGUuX3dpbixcbiAgICB9KVxuXG4gICAgcmV0dXJuIGludGVyYWN0YWJsZVxuICB9XG5cbiAgaW5kZXhPZkVsZW1lbnQgKHRhcmdldDogSW50ZXJhY3QuVGFyZ2V0LCBjb250ZXh0OiBEb2N1bWVudCB8IEVsZW1lbnQpIHtcbiAgICBjb250ZXh0ID0gY29udGV4dCB8fCB0aGlzLnNjb3BlLmRvY3VtZW50XG5cbiAgICBjb25zdCBsaXN0ID0gdGhpcy5saXN0XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxpc3QubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IGludGVyYWN0YWJsZSA9IGxpc3RbaV1cblxuICAgICAgaWYgKGludGVyYWN0YWJsZS50YXJnZXQgPT09IHRhcmdldCAmJiBpbnRlcmFjdGFibGUuX2NvbnRleHQgPT09IGNvbnRleHQpIHtcbiAgICAgICAgcmV0dXJuIGlcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gLTFcbiAgfVxuXG4gIGdldCAoZWxlbWVudDogSW50ZXJhY3QuVGFyZ2V0LCBvcHRpb25zLCBkb250Q2hlY2tJbkNvbnRleHQ/OiBib29sZWFuKSB7XG4gICAgY29uc3QgcmV0ID0gdGhpcy5saXN0W3RoaXMuaW5kZXhPZkVsZW1lbnQoZWxlbWVudCwgb3B0aW9ucyAmJiBvcHRpb25zLmNvbnRleHQpXVxuXG4gICAgcmV0dXJuIHJldCAmJiAodXRpbHMuaXMuc3RyaW5nKGVsZW1lbnQpIHx8IGRvbnRDaGVja0luQ29udGV4dCB8fCByZXQuaW5Db250ZXh0KGVsZW1lbnQpKSA/IHJldCA6IG51bGxcbiAgfVxuXG4gIGZvckVhY2hNYXRjaCAoZWxlbWVudDogRG9jdW1lbnQgfCBFbGVtZW50LCBjYWxsYmFjazogKGludGVyYWN0YWJsZTogYW55KSA9PiBhbnkpIHtcbiAgICBmb3IgKGNvbnN0IGludGVyYWN0YWJsZSBvZiB0aGlzLmxpc3QpIHtcbiAgICAgIGxldCByZXRcblxuICAgICAgaWYgKCh1dGlscy5pcy5zdHJpbmcoaW50ZXJhY3RhYmxlLnRhcmdldClcbiAgICAgIC8vIHRhcmdldCBpcyBhIHNlbGVjdG9yIGFuZCB0aGUgZWxlbWVudCBtYXRjaGVzXG4gICAgICAgID8gKHV0aWxzLmlzLmVsZW1lbnQoZWxlbWVudCkgJiYgdXRpbHMuZG9tLm1hdGNoZXNTZWxlY3RvcihlbGVtZW50LCBpbnRlcmFjdGFibGUudGFyZ2V0KSlcbiAgICAgICAgLy8gdGFyZ2V0IGlzIHRoZSBlbGVtZW50XG4gICAgICAgIDogZWxlbWVudCA9PT0gaW50ZXJhY3RhYmxlLnRhcmdldCkgJiZcbiAgICAgICAgLy8gdGhlIGVsZW1lbnQgaXMgaW4gY29udGV4dFxuICAgICAgICAoaW50ZXJhY3RhYmxlLmluQ29udGV4dChlbGVtZW50KSkpIHtcbiAgICAgICAgcmV0ID0gY2FsbGJhY2soaW50ZXJhY3RhYmxlKVxuICAgICAgfVxuXG4gICAgICBpZiAocmV0ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgcmV0dXJuIHJldFxuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gaW5pdFNjb3BlIChzY29wZTogU2NvcGUsIHdpbmRvdzogV2luZG93KSB7XG4gIHdpbi5pbml0KHdpbmRvdylcbiAgZG9tT2JqZWN0cy5pbml0KHdpbmRvdylcbiAgYnJvd3Nlci5pbml0KHdpbmRvdylcbiAgcmFmLmluaXQod2luZG93KVxuICBldmVudHMuaW5pdCh3aW5kb3cpXG5cbiAgaW50ZXJhY3Rpb25zLmluc3RhbGwoc2NvcGUpXG4gIHNjb3BlLmRvY3VtZW50ID0gd2luZG93LmRvY3VtZW50XG5cbiAgcmV0dXJuIHNjb3BlXG59XG4iXX0=