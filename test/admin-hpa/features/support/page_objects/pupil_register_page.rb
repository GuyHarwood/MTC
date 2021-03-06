class PupilRegisterPage < SitePrism::Page
  set_url '/pupil-register/pupils-list'

  element :heading, '.heading-xlarge', text: 'Pupil Register'
  element :add_pupil, 'a', text: 'Add pupil'
  element :add_multiple_pupil, 'a', text: 'Add multiple pupils'
  element :info_message, '.govuk-info-message', text: 'Changes to pupil details have been saved'
  element :incomplete_message, '.govuk-warning-message'
  element :new_pupil_info_message, '.govuk-info-message', text: '1 new pupil has been added'
  element :add_multiple_pupil_info_message, '.govuk-info-message'
  element :edited_pupil, '.highlight-item'
  element :pupil_status_explanation, '.govuk-details__summary-text'
  section :phase_banner, PhaseBanner, '.govuk-phase-banner'

  section :pupil_list_column_heading, '#register-pupils thead tr' do
    element :name_heading, 'th:nth-child(1)'
    element :group_heading, 'th:nth-child(2)'
    element :result_heading, 'th:nth-child(3)'
  end

  section :pupil_list, '#register-pupils' do
    sections :pupil_row, 'tbody tr' do
      element :names, 'td:nth-child(1)'
      element :edited_pupil, '.govuk-highlight-item'
      element :incomplete_pupil, '.govuk-warning-item'
      element :group, 'td:nth-child(2)'
      element :result, 'td:nth-child(3)'
      element :edit_pupil_link, 'a'
    end
  end

  def find_pupil_row(name)
    wait_until{!(pupil_list.pupil_row.find {|pupil| pupil.text.include? name}).nil?}
    pupil_list.pupil_row.find {|pupil| pupil.text.include? name}
  end

end
