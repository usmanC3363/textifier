import { Extension } from '@tiptap/core'
import { Decoration, DecorationSet } from '@tiptap/pm/view'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import type { ContentAnnotation } from '@/features/versions/types/version.types'
import { getUserColor } from '@/features/versions/utils/userColorMap'

const annotationPluginKey = new PluginKey<{
  annotations: ContentAnnotation[]
  hoveredUserId?: string
}>('versionAnnotations')

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    versionAnnotation: {
      setAnnotations: (annotations: ContentAnnotation[]) => ReturnType
    }
  }
}

export const VersionAnnotationsExtension = Extension.create({
  name: 'versionAnnotations',

  addCommands() {
    return {
      setAnnotations:
        (annotations: ContentAnnotation[]) =>
        ({ editor }) => {
          const tr = editor.state.tr
          tr.setMeta(annotationPluginKey, { annotations })
          editor.view.dispatch(tr)
          return true
        },
    }
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: annotationPluginKey,

        state: {
          init() {
            return { annotations: [], hoveredUserId: undefined }
          },

          apply(tr, value) {
            const meta = tr.getMeta(annotationPluginKey)
            if (meta?.annotations) {
              return { ...value, annotations: meta.annotations }
            }
            return value
          },
        },

        props: {
          decorations(state) {
            const pluginState = annotationPluginKey.getState(state)
            if (!pluginState || pluginState.annotations.length === 0) {
              return null
            }

            const decorations: Decoration[] = []
            const docSize = state.doc.content.size

            for (const ann of pluginState.annotations) {
              if (ann.from >= ann.to || ann.to > docSize) continue

              const color = getUserColor(ann.userId)

              decorations.push(
                Decoration.inline(ann.from, ann.to, {
                  style: `
                    background-color: ${color}99;
                    border-bottom: 2px solid ${color};
                    padding: 2px 3px 2px 3px;
                    border-radius: 0px;
                    margin: 0px 0px 0px 0px;
                  `,
                  'data-user-id': ann.userId,
                })
              )
            }

            return DecorationSet.create(state.doc, decorations)
          },
        },
      }),
    ]
  },
})
