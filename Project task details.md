Take-Home Interview Assessment

Software Quality Automation Engineer

Objective
Demonstrate your ability to analyze requirements, identify meaningful test coverage, and build maintainable
automated UI tests using behavior-driven development (BDD).

1. Scenario
You are provided with a small web application called Vegetable Counter and a set of functional requirements. Your
task is to create an automated test suite that validates the application&#39;s behavior.

2. Technology
Use Node.js, Cucumber.js, and Playwright. You may use additional libraries when they provide clear value.

3. Required Test Scenarios
 Cucumbers — Given I have 5 cucumbers and eat 3 cucumbers, the application should show 2 cucumbers
remaining.
 Carrots — Given I have 10 carrots and eat 3 carrots, the application should show 7 carrots remaining.
 Multiple vegetables — Given I have 8 cucumbers and 5 carrots, and eat 3 cucumbers and 2 carrots, the
application should show 5 cucumbers, 3 carrots, and 8 vegetables remaining.
 Invalid quantity — Include a scenario demonstrating the application&#39;s handling of an invalid quantity based on
the requirements.
 Reset — Include a scenario demonstrating that Reset returns the application to its initial state.

4. Additional Coverage
Identify and automate at least three additional scenarios that you believe provide meaningful coverage. Do not
simply create variations of the same happy path. Consider boundaries, invalid input, validation behavior, state, and
combinations of inputs.
Document your reasoning for the additional scenarios in your README.

5. BDD Requirements
Use Gherkin feature files and Cucumber step definitions. Where appropriate, use Scenario Outlines, Examples
tables, or Data Tables to avoid unnecessary duplication.

6. Automation Requirements
 Run from a clean checkout.
 Use Playwright for browser automation.
 Use reliable locators.

 Include meaningful assertions.
 Avoid unnecessary sleeps/timeouts.
 Keep test setup and teardown maintainable.
 Keep page interaction logic separate from step definitions where practical.
 Make tests reasonably independent and repeatable.
 Produce useful output when a test fails.

7. Deliverables
Submit a GitHub repository or ZIP file containing:
 Complete test project
 package.json
 Cucumber configuration, if used
 Playwright configuration, if used
 Feature files
 Step definitions
 Page objects/helpers, if used
 README.md
 Any additional configuration required to run the suite
Do not include node_modules.

8. README
Your README should explain:
 Prerequisites
 How to install dependencies
 How to start the provided application
 How to run the automated tests
 Any configuration required
 Which additional scenarios you selected and why
 Any assumptions or trade-offs you made

9. What We Will Evaluate
 Test design and coverage
 Ability to identify risk and edge cases
 Appropriate use of BDD
 Automation architecture and maintainability
 Locator strategy
 Assertion quality
 Test reliability and independence
 Code quality
 Documentation
 Ability to explain testing decisions
There is intentionally no single “perfect” test suite. Be prepared to explain what you chose to test, what you chose
not to test, and why.

10. Time Expectation
Please spend approximately 2–4 hours on the assessment. You are not expected to implement every possible test.
We are interested in the quality of your decisions as much as the number of tests you write.