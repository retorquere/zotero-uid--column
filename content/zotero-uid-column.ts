declare const Zotero: any
// declare const Components: any

import { debug } from './debug'

if (!Zotero.UidColumn) {
  const monkey_patch_marker = 'UidColumnMonkeyPatched'

  // eslint-disable-next-line @typescript-eslint/no-unused-vars, no-inner-declarations, prefer-arrow/prefer-arrow-functions
  function patch(object, method, patcher) {
    if (object[method][monkey_patch_marker]) return
    object[method] = patcher(object[method])
    object[method][monkey_patch_marker] = true
  }

  patch(Zotero.Item.prototype, 'getField', original => function Zotero_Item_prototype_getField(field: string, unformatted: boolean, includeBaseMapped: boolean): string {
    try {
      if (field === 'itemKey') {
        return this.key as string
      }
      else if (field === 'select-link' || field === 'uri') {
        const uri: string = Zotero.URI.getItemURI(this)
        if (field === 'uri') return uri
        if (field ===  'select-link') {
          const [ , kind, lib, key ] = uri.match(/^https?:\/\/zotero\.org\/(users|groups)\/((?:local\/)?[^/]+)\/items\/(.+)/)
          return (kind === 'users') ? `zotero://select/library/items/${key}` : `zotero://select/groups/${lib}/items/${key}`
        }
      }
    }
    catch (err) {
      debug('Error: patched getField:', field, unformatted, includeBaseMapped, err.message)
      return ''
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, prefer-rest-params
    return original.apply(this, arguments) as string
  })

  class UidColumn { // tslint:disable-line:variable-name
    private initialized = false
    private globals: Record<string, any>
    private strings: any

    // eslint-disable-next-line @typescript-eslint/require-await
    public async load(globals: Record<string, any>) {
      this.globals = globals

      if (this.initialized) return
      this.initialized = true

      this.strings = globals.document.getElementById('zotero-uid-column-strings')
    }
  }

  Zotero.UidColumn = new UidColumn
}
