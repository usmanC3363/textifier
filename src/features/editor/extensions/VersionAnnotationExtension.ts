import { Extension } from '@tiptap/core'
import { Decoration, DecorationSet } from '@tiptap/pm/view'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import type { ContentAnnotation } from '@/features/versions/types/version.types'
import { getUserColor } from '@/features/versions/utils/userColorMap'

type AnnotationPluginState = {
  annotations: ContentAnnotation[]
  hoveredUserId?: string
}

const annotationPluginKey = new PluginKey<AnnotationPluginState>(
  'versionAnnotations'
)

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    versionAnnotation: {
      setAnnotations: (annotations: ContentAnnotation[]) => ReturnType
      setHoveredUser: (userId?: string | null) => ReturnType
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
          editor.view.dispatch(
            editor.state.tr.setMeta(annotationPluginKey, { annotations })
          )
          return true
        },

        setHoveredUser:
        (userId: string | null | undefined) =>
        ({ editor }) => {
          editor.view.dispatch(
            editor.state.tr.setMeta(annotationPluginKey, {
              hoveredUserId: userId,
            })
          )
          return true
        }
    }
  },

  addProseMirrorPlugins() {
    return [
      new Plugin<AnnotationPluginState>({
        key: annotationPluginKey,

        state: {
          init() {
            return {
              annotations: [],
              hoveredUserId: undefined,
            }
          },

          apply(tr, value) {
            const meta = tr.getMeta(annotationPluginKey)
            let annotations = value.annotations
          
            // 🔥 remap positions when doc changes
            if (tr.docChanged) {
              annotations = annotations
                .map(ann => {
                  const from = tr.mapping.map(ann.from)
                  const to = tr.mapping.map(ann.to)
                  return from < to ? { ...ann, from, to } : null
                })
                .filter(Boolean) as typeof annotations
            }
          
            if (!meta) {
              return { ...value, annotations }
            }
          
            return {
              annotations: meta.annotations ?? annotations,
              hoveredUserId:
                meta.hoveredUserId !== undefined
                  ? meta.hoveredUserId
                  : value.hoveredUserId,
            }
          }               
        },

        props: {
          decorations(state) {
            const pluginState = annotationPluginKey.getState(state)
            if (!pluginState || pluginState.annotations.length === 0) {
              return null
            }

            
            const { annotations, hoveredUserId } = pluginState
            const decorations: Decoration[] = []
            const docSize = state.doc.content.size

            // 
            for (const ann of annotations) {
              if (ann.from >= ann.to || ann.to > docSize) continue
              
              // 🔥 WHITESPACE FIX (CRITICAL)
              let from = ann.from + 1
              let to = ann.to + 1
              if (from < 0 || to > state.doc.content.size) continue

              // if (state.doc.textContent.length < ann.to) continue
            
              const color = getUserColor(ann.userId)
              const isHovered = hoveredUserId === ann.userId
              const dimOthers = hoveredUserId && !isHovered
            
              decorations.push(
                Decoration.inline(from, to, {
                  'data-user-id': ann.userId,
                  style: `
                    background-color: ${color}99;
                    border-bottom: 2px solid ${color};
                    transition: all 150ms ease;
                    ${isHovered ? `box-shadow: 0 0 4px ${color};` : ''}
                    ${dimOthers ? `opacity: 0.35;` : ''}
                  `,
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
