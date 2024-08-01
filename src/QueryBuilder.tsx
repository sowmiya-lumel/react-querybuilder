// tslint:disable: max-func-body-length

import arrayFindIndex from 'array-find-index';
import cloneDeep from 'lodash/cloneDeep';
import { nanoid } from 'nanoid';
import objectAssign from 'object-assign';
import React, { useEffect, useState } from 'react';
import { ActionElement, NotToggle, ValueEditor, ValueSelector, NavTab } from './controls';
import { Rule } from './Rule';
import { RuleGroup } from './RuleGroup';
import {
  Classnames,
  Controls,
  NameLabelPair,
  QueryBuilderProps,
  RuleGroupType,
  RuleType,
  Translations,
  Field,
  ValueEditorType
} from './types';
import { findRule, generateValidQuery, getLevel, isRuleGroup } from './utils';

const defaultTranslations: Translations = {
  fields: {
    title: 'Fields'
  },
  operators: {
    title: 'Operators'
  },
  value: {
    title: 'Value'
  },
  removeRule: {
    label: 'x',
    title: 'Remove rule'
  },
  removeGroup: {
    label: 'x',
    title: 'Remove group'
  },
  addRule: {
    label: ' Add filter',
    title: 'Add filter'
  },
  clearRule: {
    label: ' Clear',
    title: 'Clear rule'
  },
  addGroup: {
    label: ' Add group',
    title: 'Add group'
  },
  combinators: {
    title: 'Combinators'
  },
  notToggle: {
    title: 'Invert this group'
  }
};

const defaultOperators: NameLabelPair[] = [
  { name: 'in', label: 'in' },
  { name: 'null', label: 'is null' },
  { name: 'notNull', label: 'is not null' },
  { name: 'notIn', label: 'not in' },
  { name: '=', label: '=' },
  { name: '!=', label: '!=' },
  { name: '<', label: '<' },
  { name: '>', label: '>' },
  { name: '<=', label: '<=' },
  { name: '>=', label: '>=' },
  { name: 'contains', label: 'contains' },
  { name: 'beginsWith', label: 'begins with' },
  { name: 'endsWith', label: 'ends with' },
  { name: 'doesNotContain', label: 'does not contain' },
  { name: 'doesNotBeginWith', label: 'does not begin with' },
  { name: 'doesNotEndWith', label: 'does not end with' }
];

const defaultCombinators: NameLabelPair[] = [
  { name: 'and', label: 'And' },
  { name: 'or', label: 'Or' }
];

const defaultControlClassnames: Classnames = {
  queryBuilder: '',
  ruleGroup: '',
  header: '',
  combinators: '',
  addRule: '',
  clearRule: '',
  addGroup: '',
  removeGroup: '',
  notToggle: '',
  rule: '',
  fields: '',
  operators: '',
  value: '',
  removeRule: ''
};

const fieldNames = {
  LAST_UPDATED_BY: 'LAST_UPDATED_BY'
};

const keyNames = {
  ID: 'id',
  LABEL: 'label'
};

const defaultControlElements: Controls = {
  addGroupAction: ActionElement,
  clearRuleAction: ActionElement,
  removeGroupAction: ActionElement,
  addRuleAction: ActionElement,
  removeRuleAction: ActionElement,
  combinatorSelector: NavTab,
  fieldSelector: ValueSelector,
  operatorSelector: ValueSelector,
  parentOperatorSelector: ValueSelector,
  valueEditor: ValueEditor,
  notToggle: NotToggle,
  ruleGroup: RuleGroup,
  rule: Rule
};

export const QueryBuilder: React.FC<QueryBuilderProps> = ({
  query,
  fields = [],
  operators = defaultOperators,
  combinators = defaultCombinators,
  translations = defaultTranslations,
  controlElements,
  getPlaceHolder,
  getOperators,
  getValueEditorType,
  getInputType,
  getValues,
  onQueryChange,
  controlClassnames,
  showCombinatorsBetweenRules = false,
  enableNormalView = false,
  onAdvancedClick,
  showNotToggle = false,
  getSelectedColumn,
  resetOnFieldChange = true,
  showAddGroup = true,
  showAddRule = true,
  resetOnOperatorChange = false,
  removeIconatStart = false,
  customRenderer,
  getSelectionKey,
  enableDrilldown = false,
  onSaveFilter,
  theme = 'light'
}) => {
  const getInitialQuery = () => {
    // Gets the initial query
    return (query && generateValidQuery(query)) || createRuleGroup();
  };
  const createRuleGroup = (): RuleGroupType => {
    return { id: `g-${nanoid()}`, rules: [], combinator: combinators[0].name, not: false };
  };
  const createRule = (): RuleType => {
    let field = fields[0].name;
    if (getSelectedColumn) {
      const selection = getSelectedColumn();
      if (selection) field = getSelectedColumn();
    }
    const parentOperator = getOperatorsMain(field, true);
    const operator =
      parentOperator && parentOperator.length
        ? getOperatorsMain(field, false, parentOperator[0].name)[0].name
        : getOperatorsMain(field)[0].name;
    return {
      id: `r-${nanoid()}`,
      field,
      value: '',
      operator: operator,
      parentOperator: parentOperator && parentOperator.length ? parentOperator[0].name : ''
    };
  };
  const {
    getValueEditorTypeMain,
    getInputTypeMain,
    getOperatorsMain,
    getRuleDefaultValue,
    getValuesMain,
    getPlaceHolderMain,
    getValidQuery,
    getNormalQuery,
    getRuleUpdatedValue
  } = useQueryBuilderProps(
    getValueEditorType,
    getInputType,
    getValues,
    getOperators,
    operators,
    getPlaceHolder
  );

  const {
    root,
    hasColumnChildRule,
    updateCombinator,
    hasMeasureChildRule,
    updateMeasureFilterCombinator,
    clearRule,
    setRoot,
    _notifyQueryChange,
    getLevelFromRoot,
    onGroupRemove,
    onRuleRemove,
    onPropChange,
    onGroupAdd,
    onAddRullonRootLevel,
    onRuleAdd
  } = useQueryBuilderActions(
    query,
    fields,
    combinators,
    createRule,
    getInitialQuery,
    onQueryChange,
    getOperatorsMain,
    getValidQuery,
    getRuleDefaultValue,
    resetOnFieldChange,
    resetOnOperatorChange,
    getValueEditorType,
    getSelectedColumn,
    getRuleUpdatedValue
  );

  const schema = {
    fields,
    hasColumnChildRule,
    hasMeasureChildRule,
    updateMeasureFilterCombinator,
    combinators,
    classNames: { ...defaultControlClassnames, ...controlClassnames },
    clearRule,
    createRule,
    createRuleGroup,
    onRuleAdd,
    onGroupAdd,
    onRuleRemove,
    onGroupRemove,
    onPropChange,
    getLevel: getLevelFromRoot,
    isRuleGroup,
    controls: { ...defaultControlElements, ...controlElements },
    getOperators: getOperatorsMain,
    getValueEditorType: getValueEditorTypeMain,
    getInputType: getInputTypeMain,
    getPlaceHolder: getPlaceHolderMain,
    getValues: getValuesMain,
    showCombinatorsBetweenRules,
    showAddGroup,
    showAddRule,
    showNotToggle,
    removeIconatStart,
    customRenderer,
    getSelectionKey,
    enableDrilldown,
    theme
  };
  useEffect(() => {
    // Set the query state when a new query prop comes in
    let rootCopy = generateValidQuery(query || getInitialQuery()) as RuleGroupType;
    rootCopy = updateCombinator(rootCopy);
    rootCopy = updateMeasureFilterCombinator(rootCopy);
    setRoot(rootCopy);
  }, [query]);
  useEffect(() => {
    // Notify a query change on mount
    _notifyQueryChange(root);
  }, []);
  let updatedroot: RuleGroupType = root;
  if (enableNormalView) {
    updatedroot = getNormalQuery(root);
  }
  const ruleCount = updatedroot.rules.length;
  const isNoRulesApplied = enableNormalView && ruleCount === 0;
  const hederRuleClass = isNoRulesApplied ? '' : ruleCount === 1 ? 'singleRule' : 'multiRule';
  return (
    <div>
      <div className={`queryBuilder ${schema.classNames.queryBuilder}`}>
        {(isNoRulesApplied || enableNormalView) && (
          <div className={`queryBuilder-header ${hederRuleClass}`}>
            {isNoRulesApplied && <span className="no-rule"> No filters applied</span>}
            {enableNormalView && (
              <div
                title="Add new filter"
                role="button"
                className="queryBuilder-header-addfilter"
                onClick={onAddRullonRootLevel}>
                <span className="ms-Icon ms-Icon--Add"></span>
                <span className="queryBuilder-footer-title">Add Filter</span>
              </div>
            )}
          </div>
        )}

        {!isNoRulesApplied && (
          <schema.controls.ruleGroup
            translations={{ ...defaultTranslations, ...translations }}
            enableClear={enableNormalView}
            isRoot={true}
            rules={updatedroot.rules}
            combinator={root.combinator}
            schema={schema}
            id={root.id}
            not={!!root.not}
          />
        )}
      </div>
      {enableNormalView && !enableDrilldown && (
        <div className="queryBuilder-footerAdvanced">
          <div
            title="Open advanced filter"
            role="button"
            style={{ padding: 2 }}
            className="queryBuilder-footer-advanced"
            onClick={onAdvancedClick}>
            <span className="ms-Icon ms-Icon--FilterSettings advanced-filter-icon" />
            <span className="advanced-filter-title">Advanced</span>
          </div>
        </div>
      )}
    </div>
  );
};
const useColumnRuleProps = (getRoot, getFields) => {
  const hasColumnRule = (query: RuleGroupType | RuleType, isRoot: boolean) => {
    if ((query as RuleGroupType).combinator) {
      const _query: RuleGroupType = query as RuleGroupType;
      const len = _query.rules.length;
      for (let i = 0; i < len; i++) {
        const rule = _query.rules[i];
        const hasColumn = hasColumnRule(rule, false);
        if (hasColumn) return true;
      }
    } else {
      const _rule: RuleType = query as RuleType;
      const fields = getFields();
      if (
        fields.filter((field) => field.fieldType === 'column' && field.name === _rule.field)
          .length &&
        !isRoot
      ) {
        return true;
      }
    }
    return false;
  };
  const hasColumnChildRule = (query?: RuleGroupType | RuleType) => {
    if (!query) {
      query = getRoot();
    }
    if ((query as RuleGroupType).combinator) {
      const _query: RuleGroupType = query as RuleGroupType;
      const len = _query.rules.length;
      for (let i = 0; i < len; i++) {
        const rule = _query.rules[i];
        const hasColumn = hasColumnRule(rule, true);
        if (hasColumn) return true;
      }
    }
    return false;
  };
  const updateCombinator = (query: RuleGroupType) => {
    if (hasColumnChildRule(query)) {
      query.combinator = 'and';
    }
    return query;
  };
  return { hasColumnChildRule, updateCombinator };
};

const useMeasureRuleProps = (getRoot, getFields) => {
  const hasMeasureRule = (query: RuleGroupType | RuleType, isRoot: boolean) => {
    if ((query as RuleGroupType).combinator) {
      const _query: RuleGroupType = query as RuleGroupType;
      const len = _query.rules.length;
      for (let i = 0; i < len; i++) {
        const rule = _query.rules[i];
        const hasColumn = hasMeasureRule(rule, false);
        if (hasColumn) return true;
      }
    } else {
      const _rule: RuleType = query as RuleType;
      const fields = getFields();
      if (
        fields.filter((field) => field.fieldType === 'measure' && field.name === _rule.field)
          .length &&
        !isRoot
      ) {
        return true;
      }
    }
    return false;
  };

  const hasMeasureChildRule = (query?: RuleGroupType | RuleType) => {
    if (!query) {
      query = getRoot();
    }
    if ((query as RuleGroupType).combinator) {
      const _query: RuleGroupType = query as RuleGroupType;
      const len = _query.rules.length;
      for (let i = 0; i < len; i++) {
        const rule = _query.rules[i];
        const hasColumn = hasMeasureRule(rule, true);
        if (hasColumn) return true;
      }
    }
    return false;
  };
  const updateMeasureFilterCombinator = (query: RuleGroupType) => {
    if (hasMeasureChildRule(query)) {
      query.combinator = 'and';
    }
    return query;
  };
  return { hasMeasureChildRule, updateMeasureFilterCombinator };
};

const useQueryBuilderActions = (
  query: RuleGroupType | undefined,
  fields: Field[],
  combinators: NameLabelPair[],
  createRule: () => RuleType,
  getInitialQuery: () => RuleGroupType | RuleType,
  onQueryChange: (query: RuleGroupType, prop?: string, ruleid?: string) => void,
  getOperatorsMain: (field: string, isParent?: boolean, parentOperator?: string) => any,
  getValidQuery: (query: RuleGroupType | RuleType, parent: RuleGroupType, isRoot: boolean) => void,
  getRuleDefaultValue: (rule: RuleType) => any,
  resetOnFieldChange: boolean,
  resetOnOperatorChange: boolean,
  getValueEditorType: ((field: string, operator: string) => ValueEditorType) | undefined,
  getSelectedColumn: (() => string) | undefined,
  getRuleUpdatedValue: (rule: RuleType, preOperator: string) => any
) => {
  const [root, setRoot] = useState(getInitialQuery() as RuleGroupType);
  const getRoot = () => root;
  const getFields = () => fields;
  const { hasColumnChildRule, updateCombinator } = useColumnRuleProps(getRoot, getFields);
  const { hasMeasureChildRule, updateMeasureFilterCombinator } = useMeasureRuleProps(
    getRoot,
    getFields
  );
  const onRuleAdd = (rule: RuleType, parentId: string) => {
    // Adds a rule to the query
    const rootCopy = cloneDeep(root);
    const parent = findRule(parentId, rootCopy) as RuleGroupType;
    if (parent) {
      // istanbul ignore else
      const groupIndex: number = parent.rules.findIndex((rule) => {
        return (rule as RuleGroupType).combinator;
      });
      if (groupIndex > -1)
        parent.rules.splice(groupIndex, 0, { ...rule, value: getRuleDefaultValue(rule) });
      else parent.rules.push({ ...rule, value: getRuleDefaultValue(rule) });

      updateCombinator(rootCopy);
      updateMeasureFilterCombinator(rootCopy);
      setRoot(rootCopy);
      _notifyQueryChange(rootCopy);
    }
  };
  const onAddRullonRootLevel = () => {
    const rootCopy = cloneDeep(root);
    const groupIndex: number = rootCopy.rules.findIndex((rule) => {
      return (rule as RuleGroupType).combinator;
    });
    if (groupIndex > -1) rootCopy.rules.splice(groupIndex, 0, createRule());
    else rootCopy.rules.push(createRule());

    updateCombinator(rootCopy);
    updateMeasureFilterCombinator(rootCopy);
    setRoot(rootCopy);
    _notifyQueryChange(rootCopy);
  };
  const onGroupAdd = (group: RuleGroupType, parentId: string) => {
    //Adds a rule group to the query
    const rootCopy = cloneDeep(root);
    const parent = findRule(parentId, rootCopy) as RuleGroupType;
    if (parent) {
      // istanbul ignore else
      const newRule = createRule();
      group.rules.push({ ...newRule, value: getRuleDefaultValue(newRule) });
      parent.rules.push(group);
      setRoot(rootCopy);
      _notifyQueryChange(rootCopy);
    }
  };
  const onPropChange = (prop: string, value: any, ruleId: string) => {
    const rootCopy = cloneDeep(root);
    const rule = findRule(ruleId, rootCopy) as RuleType;
    if (rule) {
      // istanbul ignore else

      const { isLastUpdatedField, isPersonField, updateValue } = getValueOnPropChange(
        value,
        rule,
        prop
      );
      const preOperator = rule.operator;
      isLastUpdatedField || isPersonField
        ? objectAssign(rule, { [prop]: updateValue, valueMeta: value['email'] })
        : objectAssign(rule, { [prop]: updateValue });
      if (resetOnFieldChange && prop === 'field') {
        // Reset operator and set default value for field change
        const parentOperator = getOperatorsMain(updateValue, true);
        const operator =
          parentOperator && parentOperator.length
            ? getOperatorsMain(updateValue, false, parentOperator[0].name)[0].name
            : getOperatorsMain(updateValue)[0].name;
        objectAssign(rule, {
          operator: operator,
          parentOperator: parentOperator && parentOperator.length ? parentOperator[0].name : '',
          value: getRuleDefaultValue(rule)
        });
      }
      if (resetOnOperatorChange && prop === 'operator')
        Object.assign(rule, { value: getRuleUpdatedValue(rule, preOperator) });
      if (resetOnOperatorChange && prop === 'parentOperator')
        Object.assign(rule, {
          parentOperator: updateValue,
          operator: getOperatorsMain(updateValue)[0].name,
          value: ''
        });
      updateCombinator(rootCopy);
      updateMeasureFilterCombinator(rootCopy);
      setRoot(rootCopy);
      _notifyQueryChange(rootCopy, prop, ruleId);
    }
  };
  const onRuleRemove = (ruleId: string, parentId: string) => {
    //Removes a rule from the query
    const rootCopy = cloneDeep(root);
    const parent = findRule(parentId, rootCopy) as RuleGroupType;
    if (parent) {
      // istanbul ignore else
      const index = arrayFindIndex(parent.rules, (x) => x.id === ruleId);
      parent.rules.splice(index, 1);
      const updatedQuery: RuleGroupType = {
        id: rootCopy.id,
        name: rootCopy.name ? rootCopy.name : '',
        email: rootCopy.email ? rootCopy.email : '',
        rules: [],
        combinator: rootCopy.combinator
      };
      getValidQuery(rootCopy, updatedQuery, true);
      setRoot(updatedQuery);
      _notifyQueryChange(updatedQuery);
    }
  };
  const onGroupRemove = (groupId: string, parentId: string) => {
    //Removes a rule group from the query
    const rootCopy = cloneDeep(root);
    const parent = findRule(parentId, rootCopy) as RuleGroupType;
    if (parent) {
      // istanbul ignore else
      const index = arrayFindIndex(parent.rules, (x) => x.id === groupId);
      parent.rules.splice(index, 1);
      const updatedQuery: RuleGroupType = {
        id: rootCopy.id,
        name: rootCopy.name ? rootCopy.name : '',
        email: rootCopy.email ? rootCopy.email : '',
        isActive: rootCopy.isActive,
        disabled: rootCopy.disabled,
        rules: [],
        combinator: rootCopy.combinator
      };
      getValidQuery(rootCopy, updatedQuery, true);
      updateCombinator(updatedQuery);
      updateMeasureFilterCombinator(updatedQuery);
      _notifyQueryChange(updatedQuery);
    }
  };
  const clearRule = () => {
    const rootCopy = cloneDeep(root);
    const updatedQuery: RuleGroupType = {
      id: rootCopy.id,
      name: rootCopy.name ? rootCopy.name : '',
      email: rootCopy.email ? rootCopy.email : '',
      isActive: rootCopy.isActive,
      disabled: rootCopy.disabled,
      rules: [],
      combinator: rootCopy.combinator
    };
    updateCombinator(updatedQuery);
    updateMeasureFilterCombinator(updatedQuery);
    _notifyQueryChange(updatedQuery);
  };
  const getLevelFromRoot = (id: string) => getLevel(id, 0, root); //Gets the level of the rule with the provided ID

  const _notifyQueryChange = (newRoot: RuleGroupType, prop?: string, ruleId?: string) => {
    // Executes the `onQueryChange` function, if provided
    if (onQueryChange) onQueryChange(cloneDeep(newRoot), prop, ruleId);
  };
  return {
    root,
    clearRule,
    setRoot,
    getInitialQuery,
    createRule,
    _notifyQueryChange,
    hasColumnChildRule,
    hasMeasureChildRule,
    updateMeasureFilterCombinator,
    updateCombinator,
    getLevelFromRoot,
    onGroupRemove,
    onRuleRemove,
    onPropChange,
    onGroupAdd,
    onAddRullonRootLevel,
    onRuleAdd
  };
};
const useQueryBuilderProps = (
  getValueEditorType: any,
  getInputType: any,
  getValues: any,
  getOperators: any,
  operators: NameLabelPair[],
  getPlaceHolder: any
) => {
  const getNormalQuery = (query: RuleGroupType) => {
    const updatedQuery: RuleGroupType = {
      id: query.id,
      name: query.name ? query.name : '',
      email: query.email ? query.email : '',
      isActive: query.isActive,
      disabled: query.disabled,
      rules: [],
      combinator: query.combinator
    };
    query.rules.forEach((rule) => {
      if (!(rule as RuleGroupType).combinator) updatedQuery.rules.push(rule);
    });
    return updatedQuery;
  };
  const getValueEditorTypeMain = (field: string, operator: string, parentOperator?: string) => {
    // Gets the ValueEditor type for a given field and operator
    if (getValueEditorType) {
      const vet = getValueEditorType(field, operator, parentOperator);
      if (vet) return vet;
    }
    return 'text';
  };
  const getPlaceHolderMain = (field: string, operator: string, parentOperator: string) => {
    // Gets the `<input />` type for a given field and operator
    if (getPlaceHolder) {
      const placeHolder = getPlaceHolder(field, operator, parentOperator);
      if (placeHolder) return placeHolder;
    }
    return '';
  };
  const getInputTypeMain = (field: string, operator: string) => {
    // Gets the `<input />` type for a given field and operator
    if (getInputType) {
      const inputType = getInputType(field, operator);
      if (inputType) return inputType;
    }
    return 'text';
  };
  const getValuesMain = (field: string, operator: string) => {
    // Gets the list of valid values for a given field and operator
    if (getValues) {
      const vals = getValues(field, operator);
      if (vals) return vals;
    }
    return [];
  };
  const getOperatorsMain = (field: string, isParent?: boolean, parentOperator?: string) => {
    // Gets the operators for a given field
    if (getOperators) {
      const ops = getOperators(field, isParent, parentOperator);
      if (ops) return ops;
    }
    return operators;
  };
  const getRuleUpdatedValue = (rule: RuleType, preOperator: string) => {
    const preType = getValueEditorType && getValueEditorType(rule.field, preOperator);
    const curType = getValueEditorType && getValueEditorType(rule.field, rule.operator);
    let _value = rule.value;
    if (preType != curType) {
      switch (curType) {
        case 'checkbox':
          _value = true;
          break;
        case 'radio':
          _value = true;
          break;
        default:
          _value = '';
      }
    }
    return _value;
  };
  const getRuleDefaultValue = (rule: RuleType) => {
    let value: any = '';
    const values = getValuesMain(rule.field, rule.operator);
    if (values.length) value = '';
    else {
      const editorType = getValueEditorTypeMain(rule.field, rule.operator);
      if (editorType === 'checkbox') {
        value = false;
      }
    }
    return value;
  };
  const getValidQuery = (
    query: RuleGroupType | RuleType,
    parent: RuleGroupType,
    isRoot: boolean
  ) => {
    let root: RuleGroupType | RuleType;
    if ((query as RuleGroupType).combinator) {
      const _query: RuleGroupType = query as RuleGroupType;
      if (isRoot) {
        root = parent;
      } else {
        root = { id: _query.id, rules: [], combinator: _query.combinator };
      }
      const len = _query.rules.length;
      for (let i = 0; i < len; i++) {
        const rule = _query.rules[i];
        getValidQuery(rule, root, false);
      }
      if (!isRoot && root.rules.length > 0) {
        parent.rules.push(root);
      }
    } else {
      const _rule: RuleType = query as RuleType;
      root = getRootRule(_rule);
      parent.rules.push(root);
    }
  };
  return {
    getRuleUpdatedValue,
    getValueEditorTypeMain,
    getInputTypeMain,
    getOperatorsMain,
    getRuleDefaultValue,
    getValuesMain,
    getPlaceHolderMain,
    getValidQuery,
    getNormalQuery
  };
};

const getValueOnPropChange = (value: any, rule: RuleType, prop: string) => {
  const isValueProp = prop === 'value';
  const isLastUpdatedField = rule.field === fieldNames.LAST_UPDATED_BY && isValueProp; // ensuring updated value is valid only on value change and not other prop change
  const isPersonField: boolean =
    isValueProp && value !== null && typeof value === 'object' && 'id' in value;
  let updateValue = value;
  if (isLastUpdatedField) {
    updateValue = value[keyNames.LABEL] || updateValue;
  } // we filter with label for last updated by
  if (isPersonField) {
    updateValue = value[keyNames.ID];
  } // we filter with person id for person
  return { updateValue, isLastUpdatedField, isPersonField };
};

const getRootRule = (rule: RuleType) => {
  let root: RuleGroupType | RuleType = {
    field: rule.field,
    operator: rule.operator,
    parentOperator: rule.parentOperator,
    value: rule.value
  };
  if (typeof rule === 'object' && 'valueMeta' in rule) {
    root = {
      ...root,
      valueMeta: rule.valueMeta
    };
  }
  return root;
};

QueryBuilder.displayName = 'QueryBuilder';
