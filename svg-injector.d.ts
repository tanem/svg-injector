import { DoneCallback, Errback } from './types';
interface IOptionalArgs {
    done?: DoneCallback;
    each?: Errback;
    evalScripts?: 'always' | 'once' | 'never';
    pngFallback?: string;
    renumerateIRIElements?: boolean;
}
/**
 * :NOTE: We are using get/setAttribute with SVG because the SVG DOM spec
 * differs from HTML DOM and can return other unexpected object types when
 * trying to directly access svg properties. ex: "className" returns a
 * SVGAnimatedString with the class value found in the "baseVal" property,
 * instead of simple string like with HTML Elements.
 */
declare const SVGInjector: (elements: HTMLElement | NodeListOf<HTMLElement> | null, { done, each, evalScripts, pngFallback, renumerateIRIElements }?: IOptionalArgs) => void;
export default SVGInjector;
