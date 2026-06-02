const fs = require('fs');
const files = [
    'src/components/Sidebar.jsx',
    'src/pages/DashboardPage.jsx',
    'src/components/StatCard.jsx',
    'src/pages/JobsPage.jsx',
    'src/components/JobCard.jsx'
];

const classToStyle = (cls) => {
    const match = cls.match(/^(p[xytrbl]?)-(\d+)$/);
    if (!match) return null;
    const prop = match[1];
    const val = parseInt(match[2]) * 4 + 'px';
    
    switch(prop) {
        case 'p': return { padding: val };
        case 'px': return { paddingLeft: val, paddingRight: val };
        case 'py': return { paddingTop: val, paddingBottom: val };
        case 'pt': return { paddingTop: val };
        case 'pb': return { paddingBottom: val };
        case 'pl': return { paddingLeft: val };
        case 'pr': return { paddingRight: val };
    }
};

files.forEach(f => {
    if(!fs.existsSync(f)) {
        console.log("Not found", f);
        return;
    }
    let content = fs.readFileSync(f, 'utf8');
    
    // Find JSX opening tags that have a className string
    const tagRegex = /<([a-zA-Z0-9_.-]+)(\s+[^>]*?className=[\"\'\`\{].*?[\"\'\`\}][^>]*?)\/?>/gs;
    
    content = content.replace(tagRegex, (match, tagName, attrsStr) => {
        let newAttrsStr = attrsStr;
        let paddingStyles = {};
        
        // Match className content
        const classRegex = /className=(?:\"([^\"]*)\"|\'([^\']*)\'|\{\`([^\`]*)\`\})/;
        const classMatch = attrsStr.match(classRegex);
        
        if (classMatch) {
            const classQuoteType = classMatch[1] !== undefined ? '"' : classMatch[2] !== undefined ? "'" : '`';
            let classStr = classMatch[1] || classMatch[2] || classMatch[3];
            let newClassStr = classStr;
            
            // Extract and remove padding classes
            const paddingClasses = classStr.match(/\bp[xytrbl]?-\d+\b/g);
            if (paddingClasses) {
                paddingClasses.forEach(cls => {
                    const styleObj = classToStyle(cls);
                    if (styleObj) {
                        Object.assign(paddingStyles, styleObj);
                        newClassStr = newClassStr.replace(new RegExp('\\\\b' + cls + '\\\\b', 'g'), '');
                    }
                });
                newClassStr = newClassStr.replace(/\s+/g, ' ').trim();
                
                // Replace className in attrsStr
                if (classQuoteType === '`') {
                    newAttrsStr = newAttrsStr.replace(classMatch[0], 'className={`' + newClassStr + '`}');
                } else {
                    newAttrsStr = newAttrsStr.replace(classMatch[0], 'className="' + newClassStr + '"');
                }
            }
        }
        
        if (Object.keys(paddingStyles).length > 0) {
            // Check if style prop already exists
            const styleRegex = /style=\{\{([^}]+)\}\}/;
            const styleMatch = newAttrsStr.match(styleRegex);
            
            let styleStr = Object.entries(paddingStyles)
                .map(([k, v]) => `"${k}":"${v}"`)
                .join(',');
                
            if (styleMatch) {
                const updatedStyle = `style={{${styleMatch[1]}, ${styleStr}}}`;
                newAttrsStr = newAttrsStr.replace(styleRegex, updatedStyle);
            } else {
                newAttrsStr = newAttrsStr + ` style={{${styleStr}}}`;
            }
        }
        
        return match.replace(attrsStr, newAttrsStr);
    });
    
    fs.writeFileSync(f, content);
    console.log('Updated ' + f);
});
