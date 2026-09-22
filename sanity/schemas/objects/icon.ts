import { defineField, type StringRule } from 'sanity'
import { ICONS, PICKABLE_ICONS } from '../../../lib/icons'
import { IconInput } from '../../components/IconInput'

/**
 * Поле «Іконка» — одно на весь проект: категории, практики, ценности.
 *
 * Раньше у каждого документа был свой список: у категорий четыре
 * иконки, у практик семнадцать, у ценностей — своя копия. Новая
 * иконка появлялась в одном месте и не появлялась в другом.
 * Теперь список берётся из lib/icons.ts, а в студии вместо выпадающего
 * списка из английских слов — сетка самих знаков с поиском.
 *
 * options.list остаётся ради проверки: значение, которого нет в
 * наборе, студия подсветит ошибкой.
 */
export const iconField = ({
  required = false,
  description,
  group,
}: { required?: boolean; description?: string; group?: string } = {}) =>
  defineField({
    name: 'icon',
    title: 'Іконка',
    type: 'string',
    ...(group ? { group } : {}),
    description,
    options: { list: PICKABLE_ICONS.map((v) => ({ value: v, title: ICONS[v].label })) },
    components: { input: IconInput },
    ...(required ? { validation: (r: StringRule) => r.required() } : {}),
  })
