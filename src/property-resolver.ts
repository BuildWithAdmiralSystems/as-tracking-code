export function resolvePropertyValue(resolvedValue: string, element: Element): any {
  switch (resolvedValue) {
    case 'innerHTML':
      return element.innerHTML;
    case 'innerHTML-parseInt':
      return parseInt(element.innerHTML, 10);
    case 'innerHTML-parseFloat':
      return parseFloat(element.innerHTML);
    case 'innerText':
      return (element as HTMLElement).innerText;
    case 'innerText-parseInt':
      return parseInt((element as HTMLElement).innerText, 10);
    case 'innerText-parseFloat':
      return parseFloat((element as HTMLElement).innerText);
    case 'boolean:true':
      return true;
    case 'boolean:false':
      return false;
    case 'grabPagePath':
      return window.location.pathname;
    default:
      return resolvedValue;
  }
}
