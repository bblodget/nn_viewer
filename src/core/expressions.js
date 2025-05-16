/**
 * Expressions module
 * Handles parameter substitution and expression evaluation
 */

/**
 * Expression evaluator for parameter substitution and dynamic component generation
 */
export class ExpressionEvaluator {
    constructor() {
        // Cache for already evaluated expressions
        this.expressionCache = new Map();
    }
    
    /**
     * Evaluate an expression string with parameter values
     * @param {string} expression - The expression to evaluate
     * @param {object} params - Parameter values
     * @param {object} context - Additional context values (e.g., iterator)
     * @returns {*} The evaluated result
     */
    evaluate(expression, params = {}, context = {}) {
        if (typeof expression !== 'string') {
            return expression; // Return non-string values as-is
        }
        
        if (!expression.includes('${')) {
            return expression; // Not an expression, return as-is
        }
        
        // Create cache key
        const cacheKey = this.getCacheKey(expression, params, context);
        
        // Check cache
        if (this.expressionCache.has(cacheKey)) {
            return this.expressionCache.get(cacheKey);
        }
        
        // Process the expression
        let result = expression;
        
        try {
            // Replace all ${...} patterns with evaluated values
            result = expression.replace(/\${([^}]+)}/g, (match, expr) => {
                // Create evaluation context with parameters and iterator
                const evalContext = { ...params, ...context };
                
                // Evaluate the expression
                const value = this.evaluateExpressionString(expr, evalContext);
                
                // Return the evaluated value
                return value;
            });
            
            // If the entire expression was a single ${...}, try to parse it as a non-string
            if (expression.match(/^\${[^}]+}$/)) {
                const exprContent = expression.slice(2, -1);
                const evalContext = { ...params, ...context };
                const value = this.evaluateExpressionString(exprContent, evalContext);
                
                // If the value is a number or boolean, return it as that type
                if (typeof value === 'number' || typeof value === 'boolean') {
                    result = value;
                }
            }
            
            // Cache the result
            this.expressionCache.set(cacheKey, result);
            
            return result;
        } catch (error) {
            console.error(`Error evaluating expression "${expression}":`, error);
            // Return the original expression on error
            return expression;
        }
    }
    
    /**
     * Evaluate a JavaScript expression string in a given context
     * @param {string} expr - The expression to evaluate
     * @param {object} context - The context object with variables
     * @returns {*} The evaluated result
     */
    evaluateExpressionString(expr, context) {
        try {
            // Create a safe evaluation function with the context variables
            const contextKeys = Object.keys(context);
            const contextValues = Object.values(context);
            
            // Create a function with the context variables as parameters
            // eslint-disable-next-line no-new-func
            const evaluator = new Function(...contextKeys, `
                "use strict";
                
                // Define common math functions
                const abs = Math.abs;
                const max = Math.max;
                const min = Math.min;
                const floor = Math.floor;
                const ceil = Math.ceil;
                const round = Math.round;
                
                try {
                    return (${expr});
                } catch (e) {
                    throw new Error(\`Error evaluating \${e.message}\`);
                }
            `);
            
            // Execute the function with the context values
            return evaluator(...contextValues);
        } catch (error) {
            throw new Error(`Expression evaluation error: ${error.message}`);
        }
    }
    
    /**
     * Generate a cache key for an expression and its context
     * @param {string} expression - The expression string
     * @param {object} params - The parameters object
     * @param {object} context - The context object
     * @returns {string} The cache key
     */
    getCacheKey(expression, params, context) {
        // Create a deterministic string representation of params and context
        const paramsKey = JSON.stringify(params, Object.keys(params).sort());
        const contextKey = JSON.stringify(context, Object.keys(context).sort());
        
        return `${expression}|${paramsKey}|${contextKey}`;
    }
    
    /**
     * Process an object by evaluating all parameter expressions
     * @param {object} obj - The object to process
     * @param {object} params - Parameter values
     * @param {object} context - Additional context values
     * @returns {object} The processed object with evaluated expressions
     */
    processObject(obj, params = {}, context = {}) {
        if (!obj || typeof obj !== 'object') {
            return obj;
        }
        
        // Handle arrays
        if (Array.isArray(obj)) {
            return obj.map(item => this.processObject(item, params, context));
        }
        
        // Process each property in the object
        const result = {};
        
        for (const [key, value] of Object.entries(obj)) {
            if (typeof value === 'string') {
                result[key] = this.evaluate(value, params, context);
            } else if (typeof value === 'object' && value !== null) {
                result[key] = this.processObject(value, params, context);
            } else {
                result[key] = value;
            }
        }
        
        return result;
    }
    
    /**
     * Clear the expression cache
     */
    clearCache() {
        this.expressionCache.clear();
    }
}