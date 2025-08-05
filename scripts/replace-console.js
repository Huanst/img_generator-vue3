#!/usr/bin/env node

/**
 * 批量替换项目中的 console 语句为 Logger 调用
 * 使用方法: node scripts/replace-console.js
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 项目根目录
const projectRoot = path.resolve(__dirname, '..')
const srcDir = path.join(projectRoot, 'src')

// 需要处理的文件扩展名
const targetExtensions = ['.js', '.vue', '.ts']

// console 语句替换规则
const replacementRules = [
  {
    pattern: /console\.log\(/g,
    replacement: 'Logger.log('
  },
  {
    pattern: /console\.info\(/g,
    replacement: 'Logger.info('
  },
  {
    pattern: /console\.warn\(/g,
    replacement: 'Logger.warn('
  },
  {
    pattern: /console\.error\(/g,
    replacement: 'Logger.error('
  },
  {
    pattern: /console\.debug\(/g,
    replacement: 'Logger.debug('
  },
  {
    pattern: /console\.table\(/g,
    replacement: 'Logger.table('
  },
  {
    pattern: /console\.group\(/g,
    replacement: 'Logger.group('
  },
  {
    pattern: /console\.groupEnd\(\)/g,
    replacement: 'Logger.groupEnd()'
  },
  {
    pattern: /console\.time\(/g,
    replacement: 'Logger.time('
  },
  {
    pattern: /console\.timeEnd\(/g,
    replacement: 'Logger.timeEnd('
  }
]

/**
 * 检查文件是否需要处理
 * @param {string} filePath - 文件路径
 * @returns {boolean} 是否需要处理
 */
function shouldProcessFile(filePath) {
  const ext = path.extname(filePath)
  return targetExtensions.includes(ext)
}

/**
 * 检查文件是否包含 console 语句
 * @param {string} content - 文件内容
 * @returns {boolean} 是否包含 console 语句
 */
function hasConsoleStatements(content) {
  return /console\.(log|info|warn|error|debug|table|group|groupEnd|time|timeEnd)\s*\(/g.test(content)
}

/**
 * 检查文件是否已经导入了 Logger
 * @param {string} content - 文件内容
 * @returns {boolean} 是否已导入 Logger
 */
function hasLoggerImport(content) {
  return /import\s+Logger\s+from\s+['"].*logger['"]/.test(content) ||
         /import\s+.*Logger.*\s+from\s+['"].*logger['"]/.test(content)
}

/**
 * 添加 Logger 导入语句
 * @param {string} content - 文件内容
 * @param {string} filePath - 文件路径
 * @returns {string} 更新后的内容
 */
function addLoggerImport(content, filePath) {
  const relativePath = path.relative(path.dirname(filePath), path.join(srcDir, 'utils', 'logger.js'))
  const importPath = relativePath.startsWith('.') ? relativePath : './' + relativePath
  const loggerImport = `import Logger from '${importPath.replace(/\\/g, '/')}'`
  
  // 查找最后一个 import 语句的位置
  const importRegex = /import\s+.*from\s+['"][^'"]*['"];?\s*\n/g
  let lastImportMatch
  let match
  
  while ((match = importRegex.exec(content)) !== null) {
    lastImportMatch = match
  }
  
  if (lastImportMatch) {
    // 在最后一个 import 语句后添加
    const insertPosition = lastImportMatch.index + lastImportMatch[0].length
    return content.slice(0, insertPosition) + loggerImport + '\n' + content.slice(insertPosition)
  } else {
    // 如果没有 import 语句，在文件开头添加
    return loggerImport + '\n\n' + content
  }
}

/**
 * 替换文件中的 console 语句
 * @param {string} content - 文件内容
 * @returns {string} 替换后的内容
 */
function replaceConsoleStatements(content) {
  let updatedContent = content
  
  replacementRules.forEach(rule => {
    updatedContent = updatedContent.replace(rule.pattern, rule.replacement)
  })
  
  return updatedContent
}

/**
 * 处理单个文件
 * @param {string} filePath - 文件路径
 */
function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8')
    
    // 检查是否包含 console 语句
    if (!hasConsoleStatements(content)) {
      return
    }
    
    console.log(`处理文件: ${path.relative(projectRoot, filePath)}`)
    
    let updatedContent = content
    
    // 替换 console 语句
    updatedContent = replaceConsoleStatements(updatedContent)
    
    // 如果还没有导入 Logger，则添加导入
    if (!hasLoggerImport(updatedContent)) {
      updatedContent = addLoggerImport(updatedContent, filePath)
    }
    
    // 写回文件
    fs.writeFileSync(filePath, updatedContent, 'utf8')
    console.log(`✅ 已更新: ${path.relative(projectRoot, filePath)}`)
    
  } catch (error) {
    console.error(`❌ 处理文件失败 ${filePath}:`, error.message)
  }
}

/**
 * 递归处理目录
 * @param {string} dirPath - 目录路径
 */
function processDirectory(dirPath) {
  try {
    const items = fs.readdirSync(dirPath)
    
    items.forEach(item => {
      const itemPath = path.join(dirPath, item)
      const stat = fs.statSync(itemPath)
      
      if (stat.isDirectory()) {
        // 跳过 node_modules 和 .git 目录
        if (item !== 'node_modules' && item !== '.git' && item !== 'dist') {
          processDirectory(itemPath)
        }
      } else if (stat.isFile() && shouldProcessFile(itemPath)) {
        processFile(itemPath)
      }
    })
  } catch (error) {
    console.error(`❌ 处理目录失败 ${dirPath}:`, error.message)
  }
}

/**
 * 主函数
 */
function main() {
  console.log('🚀 开始批量替换 console 语句...')
  console.log(`📁 处理目录: ${srcDir}`)
  
  if (!fs.existsSync(srcDir)) {
    console.error('❌ src 目录不存在')
    process.exit(1)
  }
  
  processDirectory(srcDir)
  
  console.log('✅ 批量替换完成！')
  console.log('\n📝 请注意:')
  console.log('1. 请检查替换结果是否正确')
  console.log('2. 确保所有文件都正确导入了 Logger')
  console.log('3. 运行项目测试功能是否正常')
}

// 运行主函数
main()