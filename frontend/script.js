// Get form and result div by their IDs
const form = document.getElementById("analyzeForm");
const resultDiv = document.getElementById("result");
const fileInput = document.getElementById("resume");
const fileNameDisplay = document.getElementById("file-name");

// Show file name when a file is selected
fileInput.addEventListener("change", function() {
    if (this.files && this.files[0]) {
        fileNameDisplay.textContent = this.files[0].name;
        fileNameDisplay.style.color = "#38c172";
        
        // Add a subtle animation
        fileNameDisplay.style.animation = "pulse 0.5s ease-in-out";
        setTimeout(() => {
            fileNameDisplay.style.animation = "";
        }, 500);
    } else {
        fileNameDisplay.textContent = "No file chosen";
        fileNameDisplay.style.color = "#2d3748";
    }
});

// On form submission
form.addEventListener("submit", function (event) {
    event.preventDefault(); // Prevent page reload on form submit

    const resumeFile = document.getElementById("resume").files[0];
    const jobDesc = document.getElementById("jobDesc").value;

    // Check if both resume and job description are present
    if (!resumeFile || !jobDesc) {
        resultDiv.innerHTML = `<div style="color: #ef4444; text-align: center; padding: 20px; background-color: rgba(239, 68, 68, 0.05); border-radius: 12px; border: 1px solid rgba(239, 68, 68, 0.1);">
            <i class="fas fa-exclamation-circle" style="font-size: 2rem; margin-bottom: 10px;"></i>
            <p style="font-weight: 500;">Please upload a resume and enter the job description.</p>
        </div>`;
        return;
    }

    const formData = new FormData();
    formData.append("resume", resumeFile);  // Adding the resume file
    formData.append("jobDescription", jobDesc);  // Using "jobDescription" to match backend

    // Show enhanced loading animation
    resultDiv.innerHTML = `<div style="text-align: center; padding: 40px; background-color: rgba(74, 107, 223, 0.05); border-radius: 12px; border: 1px solid rgba(74, 107, 223, 0.1);">
        <div style="position: relative; width: 80px; height: 80px; margin: 0 auto;">
            <div class="loading-spinner"></div>
            <div class="loading-spinner" style="animation-delay: -0.5s; opacity: 0.5;"></div>
        </div>
        <p style="color: #4a6bdf; margin-top: 25px; font-weight: 600; font-size: 1.2rem;">Analyzing your resume</p>
        <p style="color: #718096; font-size: 0.95rem; margin-top: 10px;">Comparing keywords and skills with job description</p>
    </div>`;

    // Log the request to console for debugging
    console.log("Sending resume:", resumeFile.name);
    console.log("Job desc length:", jobDesc.length);

    fetch("http://127.0.0.1:5000/analyze", {
        method: "POST",
        body: formData,
    })
    .then(response => {
        console.log("Response status:", response.status);
        if (!response.ok) {
            throw new Error(`Server returned ${response.status}: ${response.statusText}`);
        }
        return response.json();
    })
    .then(data => {
        console.log("Response data:", data);
        if (data.error) {
            resultDiv.innerHTML = `
                <div style="color: #ef4444; text-align: center; padding: 20px; background-color: rgba(239, 68, 68, 0.05); border-radius: 12px; border: 1px solid rgba(239, 68, 68, 0.1);">
                    <i class="fas fa-exclamation-circle" style="font-size: 2rem; margin-bottom: 10px;"></i>
                    <p style="font-weight: 500;">Error: ${data.error}</p>
                </div>`;
        } else {
            // Calculate color based on score
            const scoreValue = parseFloat(data.similarity_score.replace('%', ''));
            let scoreColor = '#ef4444'; // Red for low scores
            let scoreIcon = 'fa-times-circle';
            let scoreFeedbackClass = 'danger';
            let scoreGradient = 'linear-gradient(135deg, #ff6b6b 0%, #ef4444 100%)';
            
            if (scoreValue >= 80) {
                scoreColor = '#38c172'; // Green for high scores
                scoreIcon = 'fa-check-circle';
                scoreFeedbackClass = 'success';
                scoreGradient = 'linear-gradient(135deg, #34d399 0%, #38c172 100%)';
            } else if (scoreValue >= 60) {
                scoreColor = '#4a6bdf'; // Blue for good scores
                scoreIcon = 'fa-thumbs-up';
                scoreFeedbackClass = 'primary';
                scoreGradient = 'linear-gradient(135deg, #7893f0 0%, #4a6bdf 100%)';
            } else if (scoreValue >= 40) {
                scoreColor = '#f59e0b'; // Orange for medium scores
                scoreIcon = 'fa-exclamation-circle';
                scoreFeedbackClass = 'warning';
                scoreGradient = 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)';
            }
            
            // Calculate circle progress (440 is the circumference of a circle with r=70)
            const circumference = 2 * Math.PI * 70;
            const offset = circumference - (scoreValue / 100) * circumference;

            // Prepare result items with icons and data
            const resultItems = [
                {
                    icon: 'fa-file-pdf',
                    label: 'Resume',
                    value: data.resume_filename
                },
                {
                    icon: 'fa-align-left',
                    label: 'Resume Text Length',
                    value: `${data.resume_text_length.toLocaleString()} characters`
                },
                {
                    icon: 'fa-briefcase',
                    label: 'Job Description Length',
                    value: `${data.job_description_length.toLocaleString()} characters`
                },
                {
                    icon: 'fa-chart-line',
                    label: 'Analysis Status',
                    value: `<div style="display: flex; align-items: center; gap: 5px;"><i class="fas fa-check-circle" style="color: #38c172;"></i><span>Complete</span></div>`
                }
            ];

            // Create HTML for result items with staggered animation
            const resultItemsHTML = resultItems.map((item, index) => `
                <div class="result-item" style="animation: slideUp 0.5s ${0.1 * (index + 1)}s both;">
                    <div class="result-label">
                        <i class="fas ${item.icon}"></i>
                        ${item.label}
                    </div>
                    <div>${item.value}</div>
                </div>
            `).join('');
            
            resultDiv.innerHTML = `
                <div class="match-score-container">
                    <p class="score-label">Match Score</p>
                    
                    <div class="score-circle">
                        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                            <circle class="circle-bg" cx="100" cy="100" r="70" />
                            <circle class="circle-progress" cx="100" cy="100" r="70" 
                                style="stroke: ${scoreGradient ? 'url(#scoreGradient)' : scoreColor}; stroke-dashoffset: ${circumference}px;">
                                <defs>
                                    <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stop-color="${scoreColor}" stop-opacity="0.8" />
                                        <stop offset="100%" stop-color="${scoreColor}" stop-opacity="1" />
                                    </linearGradient>
                                </defs>
                            </circle>
                        </svg>
                        <div class="match-score" style="color: ${scoreColor}; opacity: 0;">${data.similarity_score}</div>
                    </div>
                </div>
                
                <div class="result-details">
                    ${resultItemsHTML}
                </div>
                
                <div class="feedback-section" style="animation: fadeIn 0.8s 0.5s both;">
                    <div class="feedback-title">
                        <i class="fas ${scoreIcon}" style="color: ${scoreColor};"></i>
                        Feedback
                    </div>
                    <div>
                        ${getMatchFeedback(scoreValue, scoreFeedbackClass)}
                    </div>
                </div>`;
            
            // Animate the score display
            setTimeout(() => {
                // Animate the circular progress
                const circleProgress = document.querySelector('.circle-progress');
                if (circleProgress) {
                    circleProgress.style.strokeDashoffset = offset + 'px';
                }
                
                // Show and animate the score number with counting effect
                const scoreDisplay = document.querySelector('.match-score');
                if (scoreDisplay) {
                    scoreDisplay.style.opacity = '1';
                    animateNumber(0, scoreValue, 1500, value => {
                        scoreDisplay.textContent = value.toFixed(2) + '%';
                    });
                }
            }, 300);
        }
    })
    .catch(error => {
        console.error("Error:", error);
        resultDiv.innerHTML = `
            <div style="color: #ef4444; text-align: center; padding: 20px; background-color: rgba(239, 68, 68, 0.05); border-radius: 12px; border: 1px solid rgba(239, 68, 68, 0.1);">
                <i class="fas fa-exclamation-circle" style="font-size: 2rem; margin-bottom: 10px;"></i>
                <p style="font-weight: 500;">Something went wrong: ${error.message}</p>
                <p style="font-size: 0.9rem; margin-top: 10px; color: #718096;">Please check the console for details.</p>
            </div>`;
    });
});

// Function to animate number counting
function animateNumber(start, end, duration, callback) {
    const startTime = performance.now();
    
    function updateNumber(currentTime) {
        const elapsedTime = currentTime - startTime;
        const progress = Math.min(elapsedTime / duration, 1);
        // Use easeOutQuart easing function for natural deceleration
        const easing = 1 - Math.pow(1 - progress, 4);
        const currentValue = start + (end - start) * easing;
        
        callback(currentValue);
        
        if (progress < 1) {
            requestAnimationFrame(updateNumber);
        }
    }
    
    requestAnimationFrame(updateNumber);
}

// Function to provide feedback based on match score
function getMatchFeedback(score, feedbackClass) {
    let feedback = '';
    
    if (score >= 80) {
        feedback = `
            <p style="margin-bottom: 10px;"><strong>Excellent match!</strong> Your resume is highly aligned with this job description.</p>
            <ul style="list-style-type: none; padding-left: 5px;">
                <li style="margin-bottom: 8px;"><i class="fas fa-check" style="color: #38c172; margin-right: 8px;"></i> Your skills and experience are well-matched to this role</li>
                <li style="margin-bottom: 8px;"><i class="fas fa-check" style="color: #38c172; margin-right: 8px;"></i> Consider applying as soon as possible</li>
                <li><i class="fas fa-check" style="color: #38c172; margin-right: 8px;"></i> Highlight your most relevant experience in your cover letter</li>
            </ul>
        `;
    } else if (score >= 60) {
        feedback = `
            <p style="margin-bottom: 10px;"><strong>Good match!</strong> Your resume matches well with many job requirements.</p>
            <ul style="list-style-type: none; padding-left: 5px;">
                <li style="margin-bottom: 8px;"><i class="fas fa-check" style="color: #4a6bdf; margin-right: 8px;"></i> Consider highlighting more relevant skills in your resume</li>
                <li style="margin-bottom: 8px;"><i class="fas fa-check" style="color: #4a6bdf; margin-right: 8px;"></i> Make sure your experience section focuses on relevant achievements</li>
                <li><i class="fas fa-check" style="color: #4a6bdf; margin-right: 8px;"></i> Worth applying with a customized cover letter</li>
            </ul>
        `;
    } else if (score >= 40) {
        feedback = `
            <p style="margin-bottom: 10px;"><strong>Fair match.</strong> There's some alignment with the job description.</p>
            <ul style="list-style-type: none; padding-left: 5px;">
                <li style="margin-bottom: 8px;"><i class="fas fa-exclamation-circle" style="color: #f59e0b; margin-right: 8px;"></i> Try customizing your resume to better align with this job</li>
                <li style="margin-bottom: 8px;"><i class="fas fa-exclamation-circle" style="color: #f59e0b; margin-right: 8px;"></i> Add more keywords from the job description where applicable</li>
                <li><i class="fas fa-exclamation-circle" style="color: #f59e0b; margin-right: 8px;"></i> Consider addressing skills gaps in your cover letter</li>
            </ul>
        `;
    } else {
        feedback = `
            <p style="margin-bottom: 10px;"><strong>Low match.</strong> Your resume may need significant adjustments for this role.</p>
            <ul style="list-style-type: none; padding-left: 5px;">
                <li style="margin-bottom: 8px;"><i class="fas fa-times-circle" style="color: #ef4444; margin-right: 8px;"></i> Consider revising your resume substantially for this position</li>
                <li style="margin-bottom: 8px;"><i class="fas fa-times-circle" style="color: #ef4444; margin-right: 8px;"></i> Include more relevant keywords and experiences</li>
                <li><i class="fas fa-times-circle" style="color: #ef4444; margin-right: 8px;"></i> This may not be the best role for your current skills and experience</li>
            </ul>
        `;
    }
    
    return feedback;
}
