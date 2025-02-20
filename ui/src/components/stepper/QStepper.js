import { h, computed, provide, getCurrentInstance } from 'vue'

import StepHeader from './StepHeader.js'

import useDark, { useDarkProps } from '../../composables/private.use-dark/use-dark.js'
import usePanel, { usePanelProps, usePanelEmits } from '../../composables/private.use-panel/use-panel.js'

import { createComponent } from '../../utils/private.create/create.js'
import { stepperKey } from '../../utils/private.symbols/symbols.js'
import { hSlot, hMergeSlot, hDir } from '../../utils/private.render/render.js'

const camelRE = /(-\w)/g

function camelizeProps (props) {
  const acc = {}
  for (const key in props) {
    const newKey = key.replace(camelRE, m => m[ 1 ].toUpperCase())
    acc[ newKey ] = props[ key ]
  }
  return acc
}

export default createComponent({
  name: 'QStepper',

  props: {
    ...useDarkProps,
    ...usePanelProps,

    flat: Boolean,
    bordered: Boolean,
    alternativeLabels: Boolean,
    headerNav: Boolean,
    contracted: Boolean,
    headerClass: String,

    inactiveColor: String,
    inactiveIcon: String,
    doneIcon: String,
    doneColor: String,
    activeIcon: String,
    activeColor: String,
    errorIcon: String,
    errorColor: String
  },

  emits: usePanelEmits,

  setup (props, { slots }) {
    const vm = getCurrentInstance()
    const isDark = useDark(props, vm.proxy.$q)

    const {
      updatePanelsList, isValidPanelName,
      updatePanelIndex, getPanelContent,
      getPanels, panelDirectives, goToPanel,
      keepAliveProps, needsUniqueKeepAliveWrapper
    } = usePanel()

    provide(stepperKey, computed(() => ({
      goToPanel,
      keepAliveProps,
      needsUniqueKeepAliveWrapper,
      ...props
    })))

    const classes = computed(() =>
      `q-stepper q-stepper--${ props.vertical === true ? 'vertical' : 'horizontal' }`
      + (props.flat === true ? ' q-stepper--flat' : '')
      + (props.bordered === true ? ' q-stepper--bordered' : '')
      + (isDark.value === true ? ' q-stepper--dark q-dark' : '')
    )

    const headerClasses = computed(() =>
      'q-stepper__header row items-stretch justify-between'
      + ` q-stepper__header--${ props.alternativeLabels === true ? 'alternative' : 'standard' }-labels`
      + (props.flat === false || props.bordered === true ? ' q-stepper__header--border' : '')
      + (props.contracted === true ? ' q-stepper__header--contracted' : '')
      + (props.headerClass !== void 0 ? ` ${ props.headerClass }` : '')
    )

    function getContent () {
      const top = hSlot(slots.message, [])

      if (props.vertical === true) {
        isValidPanelName(props.modelValue) && updatePanelIndex()

        const content = h('div', {
          class: 'q-stepper__content'
        }, hSlot(slots.default))

        return top === void 0
          ? [ content ]
          : top.concat(content)
      }

      return [
        h(
          'div',
          { class: headerClasses.value },
          getPanels().map(panel => {
            const step = camelizeProps(panel.props)

            return h(StepHeader, {
              key: step.name,
              stepper: props,
              step,
              goToPanel
            })
          })
        ),

        top,

        hDir(
          'div',
          { class: 'q-stepper__content q-panel-parent' },
          getPanelContent(),
          'cont',
          props.swipeable,
          () => panelDirectives.value
        )
      ]
    }

    return () => {
      updatePanelsList(slots)

      return h('div', {
        class: classes.value
      }, hMergeSlot(slots.navigation, getContent()))
    }
  }
})
