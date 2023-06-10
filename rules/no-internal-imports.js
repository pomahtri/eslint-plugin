'use strict';

const path = require('path');
const fs = require('fs');

module.exports = {
    meta: {
        docs: {
          description: 'Prevents importing file from folder which contains index file (you should import only re-exported methods from index file if it exists)',
          category: 'Restrictions of imports',
        },

        messages: {
        },

        schema: []
      },

      create(context) {
        const folderIsModule = (filepath) => {
            console.log('checking for file', path.resolve(filepath, 'index.ts'));
            const res =  fs.existsSync(path.resolve(filepath, 'index.ts'));
            console.log(res);
            return res;
        }

        const getImportType = (importFileName) => {
            switch (true) {
                case importFileName.startsWith('.'):
                    return 'relative';
                case importFileName.startsWith('@'):
                    return 'absolute';
                default:
                    return 'node_modules';
            }
        }

        const checkIfCanBeImported = (sourceFileName, importFileName) => {            
            const pathParts = importFileName.split('/');
            let currentPath = path.dirname(sourceFileName);
            console.log(currentPath);
            console.log(importFileName);
            console.log(pathParts);

            if (pathParts[0] === '.') {
                pathParts.shift(); // remove '.'
            }
            const filename = pathParts.pop(); // remove filename

            for (let [index, part] of pathParts.entries()) {
                currentPath = path.resolve(currentPath, part);

                console.log(part);
                console.log(currentPath);

                if (part == '..') {
                    continue;
                }


                if (folderIsModule(currentPath)) {
                    if (index === pathParts.length - 1 && filename === 'index') {
                        return true;
                    }

                    return false;
                }
            }

            return true;
        }
        
        return {
            ImportDeclaration: (node) => {
                const importFileName = node.source.value;

                if (getImportType(importFileName) === 'node_modules') {
                    return; // no need to check node_modules
                }

                if (getImportType(importFileName) === 'absolute') {
                    return true // absolute paths aren't supported yet
                }

                const res = checkIfCanBeImported(context.getFilename(), importFileName);
                if (!res) {
                    context.report({
                        node,
                        message: 'bad import',
                    })
                }
            }
        };
    },
};
