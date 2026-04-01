/**
 * 技能市场审核 API
 * 在技能发布前执行安全审查
 */

// 审核检查项
const RED_FLAGS = [
  { pattern: /curl|wget/i, severity: 'HIGH', message: '检测到外部下载命令' },
  { pattern: /eval\s*\(|exec\s*\(/i, severity: 'HIGH', message: '检测到动态代码执行' },
  { pattern: /base64|atob|btoa/i, severity: 'MEDIUM', message: '检测到Base64编码' },
  { pattern: /\.ssh|\.aws|\.config/i, severity: 'HIGH', message: '检测到敏感目录访问' },
  { pattern: /password|secret|token|api.?key/i, severity: 'HIGH', message: '检测到凭证请求' },
  { pattern: /MEMORY\.md|USER\.md|SOUL\.md|IDENTITY\.md/i, severity: 'MEDIUM', message: '检测到隐私文件访问' },
  { pattern: /sudo|chmod|chown/i, severity: 'MEDIUM', message: '检测到权限提升请求' },
  { pattern: /https?:\/\/\d+\.\d+\.\d+\.\d+/i, severity: 'HIGH', message: '检测到IP地址网络请求' },
];

const SENSITIVE_PATHS = [
  '~/.ssh',
  '~/.aws', 
  '~/.config',
  '~/.env',
  'MEMORY.md',
  'USER.md',
  'SOUL.md',
  'IDENTITY.md',
];

/**
 * 审核技能内容
 * @param {Object} skill - 技能对象
 * @returns {Object} 审核结果
 */
function vetSkill(skill) {
  const result = {
    skill_id: skill.id || skill.name,
    skill_name: skill.name,
    passed: true,
    risk_level: 'LOW',
    red_flags: [],
    permissions: {
      files_read: [],
      files_write: [],
      commands: [],
      network: [],
    },
    recommendations: [],
  };

  // 1. 检查 SKILL.md 内容
  if (skill.skill_md) {
    for (const flag of RED_FLAGS) {
      if (flag.pattern.test(skill.skill_md)) {
        result.red_flags.push({
          ...flag,
          location: 'SKILL.md',
        });
      }
    }
  }

  // 2. 检查脚本内容
  if (skill.scripts) {
    for (const script of skill.scripts) {
      for (const flag of RED_FLAGS) {
        if (flag.pattern.test(script.content)) {
          result.red_flags.push({
            ...flag,
            location: script.path,
          });
        }
      }
    }
  }

  // 3. 检查权限范围
  if (skill.permissions) {
    result.permissions = skill.permissions;
    
    // 检查是否请求敏感文件
    for (const path of skill.permissions.files_read || []) {
      for (const sensitive of SENSITIVE_PATHS) {
        if (path.includes(sensitive)) {
          result.red_flags.push({
            severity: 'MEDIUM',
            message: `请求读取敏感文件: ${path}`,
            location: 'permissions',
          });
        }
      }
    }
  }

  // 4. 计算风险等级
  const highSeverityCount = result.red_flags.filter(f => f.severity === 'HIGH').length;
  const mediumSeverityCount = result.red_flags.filter(f => f.severity === 'MEDIUM').length;

  if (highSeverityCount >= 2) {
    result.risk_level = 'EXTREME';
    result.passed = false;
  } else if (highSeverityCount >= 1) {
    result.risk_level = 'HIGH';
    result.passed = false;
  } else if (mediumSeverityCount >= 2) {
    result.risk_level = 'MEDIUM';
  } else if (mediumSeverityCount >= 1 || result.red_flags.length > 0) {
    result.risk_level = 'LOW';
  }

  // 5. 生成建议
  if (result.red_flags.length === 0) {
    result.recommendations.push('✅ 未发现明显安全风险');
  } else {
    if (result.risk_level === 'EXTREME') {
      result.recommendations.push('⛔ 建议拒绝发布');
    } else if (result.risk_level === 'HIGH') {
      result.recommendations.push('🔴 建议人工审核后决定');
    } else if (result.risk_level === 'MEDIUM') {
      result.recommendations.push('🟡 建议修改后再发布');
    } else {
      result.recommendations.push('🟢 可以发布，但建议注意');
    }
  }

  return result;
}

/**
 * 生成审核报告
 */
function generateVettingReport(result) {
  const lines = [
    `# 技能审核报告`,
    ``,
    `**技能**: ${result.skill_name}`,
    `**状态**: ${result.passed ? '✅ 通过' : '❌ 未通过'}`,
    `**风险等级**: ${result.risk_level}`,
    ``,
    `## 红旗检查`,
    ``,
  ];

  if (result.red_flags.length === 0) {
    lines.push('✅ 未发现红旗');
  } else {
    lines.push('| 严重程度 | 位置 | 描述 |');
    lines.push('|----------|------|------|');
    for (const flag of result.red_flags) {
      const emoji = flag.severity === 'HIGH' ? '🔴' : flag.severity === 'MEDIUM' ? '🟡' : '🟢';
      lines.push(`| ${emoji} ${flag.severity} | ${flag.location} | ${flag.message} |`);
    }
  }

  lines.push('', '## 权限范围', '');
  lines.push(`- **读取文件**: ${result.permissions.files_read.join(', ') || '无'}`);
  lines.push(`- **写入文件**: ${result.permissions.files_write.join(', ') || '无'}`);
  lines.push(`- **执行命令**: ${result.permissions.commands.join(', ') || '无'}`);
  lines.push(`- **网络访问**: ${result.permissions.network.join(', ') || '无'}`);
  
  lines.push('', '## 建议', '');
  for (const rec of result.recommendations) {
    lines.push(`- ${rec}`);
  }

  return lines.join('\n');
}

module.exports = { vetSkill, generateVettingReport, RED_FLAGS, SENSITIVE_PATHS };