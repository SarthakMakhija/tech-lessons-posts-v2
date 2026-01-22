import { visit } from 'unist-util-visit';

/**
 * Remark plugin to transform custom highlight directives into <mark> elements.
 * 
 * Supports inline syntax: :h[text with [links](url) and **formatting**]
 */
export function remarkHighlight() {
    return (tree) => {
        visit(tree, (node) => {
            if (node.type === 'textDirective' && node.name === 'h') {
                const data = node.data || (node.data = {});
                data.hName = 'mark';
                data.hProperties = { class: 'author-highlight' };
            }
        });
    };
}
