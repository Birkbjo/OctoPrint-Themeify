function ruleObjectToCSSText({ selector, rule, value }) {
    const text = `.themeify ${selector()} { ${rule()}: ${value()} !important; }`;
    console.log(text);
    return text;
}

class RuleStyleSheet {
    constructor(domElement, rules) {
        this.rules = rules;
        this.styleSheet = domElement.sheet;
        this.rulesIndexToSheetRule = [];
        this.domElement = domElement;
        //this.initWithRules();
    }

    initWithRules(rules = this.rules) {
        this.rules = rules
        rules().forEach((ruleObj, i) => {
            if (ruleObj.enabled()) {
                this.addRule(ruleObj, i);
            }
        });
    }

    addRule(ruleObj, ruleIndex, sheetIndex = this.styleSheet.cssRules.length) {
        if (ruleIndex === undefined) {
            ruleIndex = this.rules().length - 1;
        }
        const cssText = ruleObjectToCSSText(ruleObj);
        this.styleSheet.insertRule(cssText, sheetIndex);
        const cssRule = this.styleSheet.cssRules[sheetIndex];
        this.rulesIndexToSheetRule[ruleIndex] = cssRule;
        return cssRule;
    }

    deleteRule(ruleIndex, sheetIndex) {
        if(sheetIndex === undefined) {
            sheetIndex = this.getCSSRulesIndexByRuleIndex(ruleIndex)
        }
        if(sheetIndex > -1) {
            this.styleSheet.deleteRule(sheetIndex)
            delete this.rulesIndexToSheetRule[ruleIndex]
            return sheetIndex
        }
        return -1
    }

    disable() {
        this.styleSheet.disabled = true
    }

    enable() {
        this.styleSheet.disabled = false
    }

    updateRule(ruleObj, ruleIndex) {
        // remove as we cannot update
        const sheetIndex = this.deleteRule(ruleIndex)
        
        if (ruleObj.enabled()) {
            const reUsedIndex = sheetIndex > -1 ? sheetIndex : undefined
            return this.addRule(ruleObj, ruleIndex, reUsedIndex)
        }
        return null
    }

    getCSSRulesIndexByRuleIndex(ruleIndex) {
        const ruleToFind = this.rulesIndexToSheetRule[ruleIndex];
        
        if (!ruleToFind) {
            return -1;
        }
        for (let i = 0; i < this.styleSheet.cssRules.length; i++) {
            const cssRule = this.styleSheet.cssRules[i];
            if (cssRule === ruleToFind) {
                return i;
            }
        }
        return -1;
    }

    static createStyleSheet(name, rulesArray) {
        const styleSheet = document.createElement("style");
        styleSheet.title = name;
       
        const s = document.head.appendChild(styleSheet);
        return new RuleStyleSheet(styleSheet, rulesArray);
    }
}

export default RuleStyleSheet;
