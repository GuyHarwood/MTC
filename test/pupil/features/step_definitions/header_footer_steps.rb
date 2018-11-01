Given(/^I am on the sign in page$/) do
  sign_in_page.load
end

Then(/^I should see a global header$/) do
  expect(sign_in_page).to have_global_header
end

Then(/^I should see a feedback text on the page$/) do
  expect(sign_in_page.phase_banner).to have_feedback
end

Then(/^I should see a footer with a link to crown copyright$/) do
  expect(sign_in_page).to have_footer_link
end

Given(/^I have logged in$/) do
  teacher_pupil_hash = generate_pins_overview_page.generate_pin
  pupil_pin_row = view_and_custom_print_live_check_page.pupil_list.rows.find {|row| row.name.text == teacher_pupil_hash[:pupil_name]}
  @pupil_credentials = {:school_password => pupil_pin_row.school_password.text, :pin => pupil_pin_row.pin.text}
  AzureTableHelper.wait_for_prepared_check(@pupil_credentials[:school_password],@pupil_credentials[:pin])
  sign_in_page.load
  sign_in_page.login(@pupil_credentials[:school_password], @pupil_credentials[:pin])
  sign_in_page.sign_in_button.click
end

Given(/^I am on the welcome page$/) do
  step 'I have logged in'
end

Given(/^I am on the instructions page$/) do
  step 'I have logged in'
  confirmation_page.read_instructions.click
end

Given(/^I am on the complete page$/) do
  step 'I have started the check'
  step 'I should be able to use the on screen keyboard to complete the test'
end