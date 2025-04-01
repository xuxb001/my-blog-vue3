<template>
  <div class="upload-container">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>考勤数据导入</span>
        </div>
      </template>
      <el-date-picker v-model="monthValue" type="month" placeholder="Pick a month" value-format="YYYY-MM" />
      <div class="content">
        <!-- 上传区域 -->
        <el-upload class="upload-demo" drag :auto-upload="false" accept=".xlsx,.xls" :on-change="handleFileChange" :limit="1">
          <el-icon class="el-icon--upload"><upload-filled /></el-icon>
          <div class="el-upload__text"> 将考勤Excel文件拖到此处或 <em>点击上传</em> </div>
          <template #tip>
            <div class="el-upload__tip"> 支持.xlsx或.xls格式的考勤表格文件 </div>
          </template>
        </el-upload>

        <!-- 操作按钮 -->
        <div class="operation-area">
          <el-button type="primary" :disabled="!selectedFile" @click="processExcel" :loading="processing"> 处理文件 </el-button>
        </div>
        <!-- 处理结果提示 -->
        <el-result v-if="processSuccess" icon="success" title="处理成功" sub-title="新的考勤统计表已生成" />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { ElMessage,  } from 'element-plus';
import { UploadFilled } from '@element-plus/icons-vue';
import * as XLSX from 'xlsx';
import type { UploadFile } from 'element-plus';
import ExcelJS from 'exceljs';

const selectedFile = ref<UploadFile | null>(null);
const processing = ref(false);
const processSuccess = ref(false);
const monthValue = ref('')

// 处理文件选择
const handleFileChange = async (uploadFile: UploadFile) => {
  selectedFile.value = uploadFile;
  processSuccess.value = false;
};

// 处理Excel文件
const processExcel = async () => {
  if (!selectedFile.value) {
    ElMessage.warning('请先选择文件');
    return;
  }
  if (!monthValue.value) {
    ElMessage.warning('请先选择考勤月份');
    return;
  }
  processing.value = true;
  try {
    const file = selectedFile.value.raw as File;
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data);
    const worksheet = workbook.Sheets['考勤明细'];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    const worksheet1 = workbook.Sheets['人员明细'];
    const jsonData1 = XLSX.utils.sheet_to_json(worksheet1);
    console.log('jsonData1',jsonData1)

    // 处理数据：按人员和日期分组统计
    const processedData = processAttendanceData(jsonData, jsonData1);
    // console.log('processedData', processedData);

    // 使用ExcelJS创建新工作簿
    const newWorkbook = new ExcelJS.Workbook();
    const newWorksheet = newWorkbook.addWorksheet('原始记录');

    // 设置表头
    newWorksheet.columns = [
      { header: '姓名', key: '姓名', width: 12 },
      { header: '部门', key: '部门', width: 40 },
      { header: '工号', key: '工号', width: 12 },
      { header: '职位', key: '职位', width: 20 },
      { header: '考勤日期', key: '考勤日期', width: 20 },
      { header: '考勤时间', key: '考勤时间', width: 20 },
      { header: '打卡时间', key: '打卡时间', width: 25 },
      { header: '打卡结果', key: '打卡结果', width: 12 },
      { header: '打卡地址', key: '打卡地址', width: 25 }
    ];

    // 设置表头样式
    newWorksheet.getRow(1).eachCell(cell => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFFFFCC' }
      };
      cell.font = {
        bold: true,
        name: '黑体',  // 新增字体设置
        size: 12,     // 新增字号设置
        color: { argb: '000000' }
      };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });
    newWorksheet.getRow(1).height = 30; // 设置表头行高为30磅
    // 添加数据行
    processedData.forEach(record => {
      const row = newWorksheet.addRow(record);
      row.height = 48; // 设置数据行高为24磅
      row.eachCell((cell, colNumber) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
        cell.font = {  // 新增数据行字体设置
          name: '黑体',
          size: 12
        };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        // 针对考勤日期列（第5列）的特殊处理
        if (colNumber === 5) {
          // 判断是否
          const matchResult = cell.text.match(/(星期六|星期日)/);
          if (matchResult) {
            cell.font.color = { argb: 'FFFF0000' }; // 红色字体
          }
        }
      });
    });

    // // 设置日期列格式
    // newWorksheet.getColumn(5).numFmt = 'yyyy-mm-dd';
    // newWorksheet.getColumn(7).numFmt = 'yyyy-mm-dd hh:mm:ss';

    // 生成文件并下载
    const buffer = await newWorkbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = `考勤统计表_${new Date().toISOString().split('T')[0]}.xlsx`;
    link.click();

    processSuccess.value = true;
    ElMessage.success('处理成功！');
  } catch (error) {
    console.error(error);
    ElMessage.error('处理文件时出错，请确保文件格式正确');
  } finally {
    processing.value = false;
  }
};

// 处理考勤数据
const processAttendanceData = (data: any[], data1: any[]) => {
  // 格式化时间
  const formatExcelTime = (excelTime: number) => {
    if (typeof excelTime === 'number') {
      const hours = Math.floor(excelTime * 24);
      const minutes = Math.floor((excelTime * 24 * 60) % 60);
      const seconds = Math.floor((excelTime * 24 * 60 * 60) % 60);
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return '';
  };
  console.log('data', data);
  const firstKey = Object.keys(data[0])[0]
  const week = data[2];

  const dealData = data.slice(4);

  let allDate = {};
  for (const key in data[3]) {
    if (data[3].hasOwnProperty(key)) {
      const value = data[3][key]+'';
      allDate[key] = `${monthValue.value}-${value.length==1?'0'+value:value}`;
    }
  }

  // 创建日期和星期的映射
  const dateWeekMap = new Map();
  const dateMap = new Map();
  // 处理bb数据（日期映射）
  Object.entries(allDate).forEach(([key, value]) => {
    if (key.startsWith('__EMPTY_')) {
      const index = key.split('__EMPTY_')[1];
      dateMap.set(key, value);
    }
  });

  // 处理week数据（星期映射）
  Object.entries(week).forEach(([key, value]) => {
    if (key.startsWith('__EMPTY_')) {
      dateWeekMap.set(key, value);
    }
  });

  const processedData = [];
  const aaMap = data1.reduce((map, item) => {
    map[item.姓名] = item;
    return map;
  }, {} as Record<string, typeof data1[0]>);

  dealData.forEach((record) => {
    const name = record[firstKey];
    const type = record['__EMPTY']; // 签到或签退

    const aaInfo = aaMap[name] || {
      工号: 'D18626',
      职位: '高级测试工程师',
      打卡地址: '中国联通南方基地',
      部门: '省分事业部-华东业务线-上海业务中心',
    };

    // 遍历每一个打卡记录
    Object.entries(record).forEach(([key, value]) => {
      if (key.startsWith('__EMPTY_') && key !== '__EMPTY') {
        const date = dateMap.get(key);
        const week = dateWeekMap.get(key) || '';
        const formattedDate = date.slice(2)
        if (date) {
          const attendanceDate = `${formattedDate} ${week}`.trim();
          const checkTime = typeof value === 'number' ? formatExcelTime(value) : value;

          // 根据签到/签退类型设置考勤时间
          const attendanceTime = type === '签到' ? '08:30' : '18:00';

          processedData.push({
            姓名: name,
            部门: aaInfo.部门,
            工号: aaInfo.工号,
            职位: aaInfo.职位,
            考勤日期: attendanceDate,
            考勤时间: `${date} ${attendanceTime}`,
            打卡时间: `${date} ${checkTime}`,
            打卡结果: value === '年假' ? '年假' : '正常',
            打卡地址: aaInfo.打卡地址,
          });
        }
      }
    });
  });
  // 按照姓名和考勤时间排序
  processedData.sort((a, b) => {
    if (a.姓名 < b.姓名) {
      return -1;
    }
    if (a.姓名 > b.姓名) {
      return 1;
    }
    // 如果姓名相同，则按考勤时间排序
    const timeA = new Date(a.考勤时间).getTime();
    const timeB = new Date(b.考勤时间).getTime();
    return timeA - timeB;
  });
  return processedData;

};
</script>

<style scoped>
.upload-container {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.content {
  min-height: 300px;
}

.operation-area {
  margin: 20px 0;
  text-align: center;
}

.preview-area {
  margin-top: 20px;
}

.preview-area h3 {
  margin-bottom: 15px;
}

:deep(.el-upload-dragger) {
  width: 100%;
  height: 200px;
}
</style>
