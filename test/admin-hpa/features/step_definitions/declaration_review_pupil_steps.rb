Then(/^I can see hdf review pupils page as per the design$/) do
    expect(declaration_review_pupils_page).to have_heading
    expect(declaration_review_pupils_page).to have_message
    expect(declaration_review_pupils_page).to have_pupils_table
    expect(declaration_review_pupils_page).to have_continue_button
end

Given(/^I am on the review pupil detail page$/) do
  step 'I have a new pupil with a reason for not taking a check'
  step 'I am on the HDF form page'
  step 'I submit the form with the hdf name fields set as Test'
end

Given(/^I have a new pupil with a reason for not taking a check$/) do
  name = (0...8).map {(65 + rand(26)).chr}.join
  step "I am on the add pupil page"
  step "I submit the form with the name fields set as #{name}"
  step "the pupil details should be stored"

  pupils_not_taking_check_page.load
  pupils_not_taking_check_page.add_reason.click
  page.execute_script "window.scrollBy(0,500)"
  @page = pupil_reason_page
  pupil_reason_page.select_reason('Absent')
  @pupil_row = pupil_reason_page.pupil_list.rows.select {|row| row.name.text.include?(name)}
  @pupil_forename = @pupil_row.first.name.text.split(',')[1].strip
  @pupil_lastname = @pupil_row.first.name.text.split(',')[0].strip
  @pupil_row.first.checkbox.click
  pupil_reason_page.sticky_banner.confirm.click

  step 'the Absent reason should be stored against the pupils'
  school_id = SqlDbHelper.find_teacher('teacher4')['school_id']
  begin
    retries ||= 0
    pupil_detail = SqlDbHelper.get_pupil_with_no_attandance_code(school_id)
    fail if !(pupil_detail.nil?)
  rescue
    sleep(15)
    retry if (retries += 1) < 5
  end
  Timeout.timeout(ENV['WAIT_TIME'].to_i, Timeout::Error, "There are still pupil with Not started status") {sleep 1 until SqlDbHelper.get_pupil_with_no_attandance_code(school_id).nil?}
end

And(/^headteacher select the pupil for updating its reason$/)do
  declaration_review_pupils_page.select_pupil(@pupil_forename)
end

Then(/^reason is updated for the pupil on HDF review pupil detail page$/) do
  actual_reason = declaration_review_pupils_page.get_pupil_reason(@pupil_forename)
  expect(actual_reason.eql?(@reason)). to be_truthy, "Expected Reason: #{@reason}... But Actual: #{actual_reason}"
end

