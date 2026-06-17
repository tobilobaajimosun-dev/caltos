import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

interface ApplyStep {
  id: string;
  label: string;
}

const STEPS: ApplyStep[] = [
  { id: 'welcome',    label: 'Welcome'         },
  { id: 'loan',       label: 'Loan Details'    },
  { id: 'personal',   label: 'Personal Info'   },
  { id: 'contact',    label: 'Contact'         },
  { id: 'address',    label: 'Address'         },
  { id: 'employment', label: 'Employment'      },
  { id: 'identity',   label: 'Identity'        },
  { id: 'income',     label: 'Income'          },
  { id: 'documents',  label: 'Documents'       },
  { id: 'review',     label: 'Review'          },
];

@Component({
  selector: 'app-apply',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './apply.component.html',
  styleUrls: ['./apply.component.scss'],
})
export class ApplyComponent {
  steps = STEPS;
  stepIndex = 0;
  submitted = false;

  // Loan details
  loanAmount = '150000';
  loanTenor = '3';
  loanPurpose = '';

  // Personal
  firstName = '';
  lastName = '';
  dob = '';
  gender = '';
  maritalStatus = '';

  // Contact
  phone = '';
  email = '';
  altPhone = '';

  // Address
  houseAddress = '';
  city = '';
  state = '';
  lga = '';

  // Employment
  employerName = '';
  employmentType = '';
  monthlyIncome = '';
  staffId = '';

  // Identity
  bvn = '';
  nin = '';
  otpSent = false;
  otp = '';

  // Income
  incomeChannel = '';

  // Documents
  docGovId: File | null = null;
  docGovIdName = '';
  docPayslip: File | null = null;
  docPayslipName = '';

  get currentStep(): ApplyStep {
    return this.steps[this.stepIndex];
  }

  get progress(): number {
    return ((this.stepIndex) / (this.steps.length - 1)) * 100;
  }

  get isFirst(): boolean {
    return this.stepIndex === 0;
  }

  get isLast(): boolean {
    return this.stepIndex === this.steps.length - 1;
  }

  next() {
    if (this.stepIndex < this.steps.length - 1) {
      this.stepIndex++;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  back() {
    if (this.stepIndex > 0) {
      this.stepIndex--;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  submit() {
    this.submitted = true;
  }

  sendOtp() {
    this.otpSent = true;
  }

  onFileChange(event: Event, field: 'govId' | 'payslip') {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    if (field === 'govId') { this.docGovId = file; this.docGovIdName = file.name; }
    if (field === 'payslip') { this.docPayslip = file; this.docPayslipName = file.name; }
  }

  readonly refNumber = 'CLT-' + Math.random().toString(36).substring(2, 8).toUpperCase();

  Math = Math;

  nigerianStates = [
    'Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno',
    'Cross River','Delta','Ebonyi','Edo','Ekiti','Enugu','FCT','Gombe','Imo',
    'Jigawa','Kaduna','Kano','Katsina','Kebbi','Kogi','Kwara','Lagos','Nasarawa',
    'Niger','Ogun','Ondo','Osun','Oyo','Plateau','Rivers','Sokoto','Taraba',
    'Yobe','Zamfara',
  ];
}
